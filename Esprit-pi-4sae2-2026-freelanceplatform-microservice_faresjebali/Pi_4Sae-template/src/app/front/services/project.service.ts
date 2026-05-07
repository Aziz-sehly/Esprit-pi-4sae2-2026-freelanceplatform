import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Experience, Project, ProjectFilters, ProjectStatsDTO, SearchResult, Status } from '../models/models';
import { environment } from '../../../environments/environment';

// ── AI Suggest DTOs ───────────────────────────────────────────────────────────
export interface AISuggestRequest  { description: string; duration: string; }
export interface AISuggestResponse { title: string; skills: string; budgetMin: number; budgetMax: number; category: string; }

@Injectable({ providedIn: 'root' })
export class ProjectService {

  /** Gateway métier (hors dépôt ProLance-Communication-MS), ex. port 8765 */
  private readonly baseUrl = `${environment.businessApiGatewayUrl}/project`;

  private readonly projectsSubject = new BehaviorSubject<Project[]>([]);
  readonly projects$ = this.projectsSubject.asObservable();
  private loaded = false;

  constructor(private readonly http: HttpClient) {}

  // ── AI SUGGEST ────────────────────────────────────────────────────────────
  aiSuggest(description: string, duration: string): Observable<AISuggestResponse> {
    const body: AISuggestRequest = { description, duration };
    return this.http.post<AISuggestResponse>(`${this.baseUrl}/ai-suggest`, body).pipe(
      catchError(() => of({ title: '', skills: '', category: '', budgetMin: 0, budgetMax: 0 }))
    );
  }

  // ── STATS ─────────────────────────────────────────────────────────────────
  getStats(): Observable<ProjectStatsDTO> {
    const empty: ProjectStatsDTO = {
      totalProjects: 0, openProjects: 0, inProgressProjects: 0,
      completedProjects: 0, cancelledProjects: 0, archivedProjects: 0,
      averageBudgetMin: 0, averageBudgetMax: 0, averageBudget: 0,
      totalBudgetMax: 0, mostPopularProjects: [], topCategories: [], topSkills: []
    };
    return this.http.get<ProjectStatsDTO>(`${this.baseUrl}/stats`).pipe(
      catchError(() => of(empty))
    );
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────
  search(query: string): Observable<Project[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params }).pipe(
      map((items) => (Array.isArray(items) ? items : []).map((dto) => this.dtoToProject(dto))),
      catchError(() => of([]))
    );
  }

  // ── FILTER ────────────────────────────────────────────────────────────────
  filter(filters: {
    category?: string;
    status?: string;
    experience?: string;
    budgetMin?: number | '';
    budgetMax?: number | '';
  }): Observable<Project[]> {
    let params = new HttpParams();
    if (filters.category)   params = params.set('category',   filters.category);
    if (filters.status)     params = params.set('status',     filters.status);
    if (filters.experience) params = params.set('experience', filters.experience);
    if (filters.budgetMin !== '' && filters.budgetMin != null)
      params = params.set('budgetMin', String(filters.budgetMin));
    if (filters.budgetMax !== '' && filters.budgetMax != null)
      params = params.set('budgetMax', String(filters.budgetMax));
    return this.http.get<any[]>(`${this.baseUrl}/filter`, { params }).pipe(
      map((items) => (Array.isArray(items) ? items : []).map((dto) => this.dtoToProject(dto))),
      catchError(() => of([]))
    );
  }

  // ── SEARCH PROJECTS (local) ───────────────────────────────────────────────
  searchProjects(filters: ProjectFilters = {}, page = 1, pageSize = 10): Observable<SearchResult<Project>> {
    return this.ensureLoaded().pipe(
      map((all) => {
        let filtered = [...all];
        if (filters.category)
          filtered = filtered.filter((p) => p.category === filters.category);
        if (filters.status)
          filtered = filtered.filter((p) => p.status === filters.status);
        if (filters.experienceLevel)
          filtered = filtered.filter((p) => p.experienceLevel === filters.experienceLevel);
        if (typeof filters.budgetMin === 'number')
          filtered = filtered.filter((p) => p.budgetMax >= filters.budgetMin!);
        if (typeof filters.budgetMax === 'number')
          filtered = filtered.filter((p) => p.budgetMin <= filters.budgetMax!);
        if (filters.query && filters.query.trim()) {
          const q = filters.query.trim().toLowerCase();
          filtered = filtered.filter(
            (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
          );
        }
        if (typeof filters.clientId === 'number')
          filtered = filtered.filter((p) => p.clientId === filters.clientId);
        const start = (page - 1) * pageSize;
        return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
      })
    );
  }

  // ── GET BY ID ─────────────────────────────────────────────────────────────
  getById(id: number): Observable<Project | undefined> {
    return this.http.get<any>(`${this.baseUrl}/GetProject/${id}`).pipe(
      map((dto) => this.dtoToProject(dto)),
      catchError(() => of(undefined))
    );
  }

  // ── GET CATEGORIES ────────────────────────────────────────────────────────
  getCategories(): Observable<string[]> {
    return this.ensureLoaded().pipe(
      map((all) => Array.from(new Set(all.map((p) => p.category))).sort())
    );
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  create(project: Omit<Project, 'id'>): Observable<Project> {
    const payload = this.projectToPayload(project);
    return this.http.post<any>(`${this.baseUrl}/Addproject`, payload).pipe(
      map((dto) => this.dtoToProject(dto)),
      tap((created) => {
        this.loaded = true;
        this.projectsSubject.next([created, ...this.projectsSubject.value]);
      }),
      catchError((error) => {
        console.error('Create project error:', error);
        return throwError(() => error);
      })
    );
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  update(id: number, patch: Partial<Project>): Observable<Project | undefined> {
    const payload = this.projectToPayload(patch);
    return this.http.put<any>(`${this.baseUrl}/UpdateProject/${id}`, payload).pipe(
      map((dto) => this.dtoToProject(dto)),
      tap((updated) => {
        const current = this.projectsSubject.value;
        const idx = current.findIndex((p) => p.id === id);
        if (idx >= 0) {
          const next = [...current];
          next[idx] = updated;
          this.projectsSubject.next(next);
        }
      }),
      catchError((error) => { console.error('Update project error:', error); return of(undefined); })
    );
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  delete(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteProject/${id}`).pipe(
      map(() => true),
      tap(() => {
        const next = this.projectsSubject.value.filter((p) => p.id !== id);
        this.projectsSubject.next(next);
      }),
      catchError((error) => { console.error('Delete project error:', error); return of(false); })
    );
  }

  // ── ARCHIVE ───────────────────────────────────────────────────────────────
  archive(id: number): Observable<Project | undefined> {
    return this.update(id, { status: Status.ARCHIVED });
  }

  // ── GET BY CLIENT ─────────────────────────────────────────────────────────
  getByClient(clientId: number, page = 1, pageSize = 50): Observable<SearchResult<Project>> {
    return this.http.get<any[]>(`${this.baseUrl}/GetProjectsByClient/${clientId}`).pipe(
      map((items) => (Array.isArray(items) ? items : []).map((dto) => this.dtoToProject(dto))),
      tap((items) => {
        this.loaded = true;
        const merged = this.mergeById(this.projectsSubject.value, items);
        this.projectsSubject.next(merged);
      }),
      map((items) => {
        const start = (page - 1) * pageSize;
        return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
      }),
      catchError(() => of({ items: [], total: 0, page, pageSize }))
    );
  }

  // ── PRIVATE: ensureLoaded ─────────────────────────────────────────────────
  private ensureLoaded(): Observable<Project[]> {
    if (this.loaded) return of(this.projectsSubject.value);
    return this.http.get<any[]>(`${this.baseUrl}/GetAllProjects`).pipe(
      map((items) => (Array.isArray(items) ? items : []).map((dto) => this.dtoToProject(dto))),
      tap((items) => { this.loaded = true; this.projectsSubject.next(items); }),
      catchError(() => { this.loaded = true; this.projectsSubject.next([]); return of([]); })
    );
  }

  // ── PRIVATE: dtoToProject ─────────────────────────────────────────────────
  private dtoToProject(dto: any): Project {
    const raw = dto ?? {};
    const skillsRaw = raw.skills ?? raw.skill;
    const skills = Array.isArray(skillsRaw)
      ? skillsRaw.map((s: any) => String(s)).filter(Boolean)
      : typeof skillsRaw === 'string'
      ? skillsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    return {
      id:              Number(raw.id),
      clientId:        Number(raw.clientId ?? raw.client_id ?? raw.client?.id ?? raw.client?.Id ?? 0),
      clientEmail:     String(raw.clientEmail ?? raw.client_email ?? ''),   // ← mappé
      title:           String(raw.title ?? ''),
      description:     String(raw.description ?? ''),
      category:        String(raw.category ?? ''),
      skills,
      budgetMin:       Number(raw.budgetMin ?? raw.budget_min ?? 0),
      budgetMax:       Number(raw.budgetMax ?? raw.budget_max ?? 0),
      duration:        String(raw.duration ?? ''),
      experienceLevel: this.normalizeExperience(raw.experienceLevel ?? raw.experience_level),
      status:          this.normalizeStatus(raw.status),
      deadline:        this.toDate(raw.deadline),
      proposalsCount:  typeof raw.proposalsCount === 'number' ? raw.proposalsCount : undefined
    };
  }

  // ── PRIVATE: projectToPayload ─────────────────────────────────────────────
  private projectToPayload(patch: Partial<Project>): any {
    const clientId = patch.clientId || (patch as any).client_id;
    const skillsCsv = Array.isArray(patch.skills) ? patch.skills.join(',') : patch.skills || '';
    let deadline: string | undefined;
    if (patch.deadline) {
      const d = patch.deadline instanceof Date ? patch.deadline : new Date(patch.deadline);
      if (!isNaN(d.getTime())) deadline = d.toISOString().split('T')[0];
    }
    const payload: any = {
      title:        patch.title,
      description:  patch.description,
      category:     patch.category,
      skills:       skillsCsv,
      budget_min:   patch.budgetMin,
      budget_max:   patch.budgetMax,
      duration:     patch.duration,
      deadline,
      clientEmail:  patch.clientEmail   // ← envoyé au backend
    };
    if (typeof clientId === 'number' && !Number.isNaN(clientId) && clientId > 0)
      payload.client = { id: clientId };
    if (patch.experienceLevel !== undefined)
      payload.experienceLevel = this.mapExperienceToBackend(patch.experienceLevel);
    if (patch.status !== undefined)
      payload.status = this.mapStatusToBackend(patch.status);
    // Supprimer les clés undefined/null
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) delete payload[key];
    });
    return payload;
  }

  // ── PRIVATE: mappers ──────────────────────────────────────────────────────
  private mapExperienceToBackend(exp: Experience): string {
    switch (exp) {
      case Experience.ENTRY:        return 'JUNIOR';
      case Experience.INTERMEDIATE: return 'INTERMEDIATE';
      case Experience.EXPERT:       return 'SENIOR';
      default:                      return 'INTERMEDIATE';
    }
  }

  private mapStatusToBackend(status: Status): string {
    switch (status) {
      case Status.OPEN:        return 'OPEN';
      case Status.IN_PROGRESS: return 'IN_PROGRESS';
      case Status.COMPLETED:   return 'COMPLETED';
      case Status.CANCELLED:   return 'CANCELLED';
      case Status.ARCHIVED:    return 'ARCHIVED';
      default:                 return 'DRAFT';
    }
  }

  private normalizeExperience(value: any): Experience {
    const v = String(value ?? '').toUpperCase();
    if (v === 'JUNIOR' || v === 'ENTRY')  return Experience.ENTRY;
    if (v === 'SENIOR' || v === 'EXPERT') return Experience.EXPERT;
    return Experience.INTERMEDIATE;
  }

  private normalizeStatus(value: any): Status {
    const v = String(value ?? '').toUpperCase();
    switch (v) {
      case 'OPEN':        return Status.OPEN;
      case 'IN_PROGRESS': return Status.IN_PROGRESS;
      case 'COMPLETED':   return Status.COMPLETED;
      case 'CANCELLED':   return Status.CANCELLED;
      case 'ARCHIVED':    return Status.ARCHIVED;
      default:            return Status.OPEN;
    }
  }

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  private mergeById(current: Project[], incoming: Project[]): Project[] {
    const mapById = new Map<number, Project>();
    for (const p of current)  mapById.set(p.id, p);
    for (const p of incoming) mapById.set(p.id, p);
    return Array.from(mapById.values()).sort((a, b) => b.id - a.id);
  }

  refreshProjects(): void { this.loaded = false; this.ensureLoaded().subscribe(); }
  clearCache(): void      { this.loaded = false; this.projectsSubject.next([]); }
}