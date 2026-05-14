import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  FreelancerProposalStats,
  ProjectProposal,
  ProposalApi,
  ProposalStatus,
  Status
} from '../models/models';
import { environment } from '../../../environments/environment';
import { ProjectService } from './project.service';

@Injectable({ providedIn: 'root' })
export class ProjectProposalService {

  private readonly baseUrl        = `${environment.businessApiGatewayUrl}/proposal`;
  private readonly projectBaseUrl = `${environment.businessApiGatewayUrl}/project`;

  constructor(
    private readonly http: HttpClient,
    private readonly projectService: ProjectService
  ) {}

  // ── NOTIFY CLIENT par email (appel API Gateway → project microservice) ────
  notifyClient(data: {
    projectId:      number;
    proposedBudget: number;
    deliveryDays:   number;
    coverLetter:    string;
  }): Observable<string> {
    return this.http.post(
      `${this.projectBaseUrl}/notify/new-proposal`,
      data,
      { responseType: 'text' }
    ).pipe(
      catchError((err) => {
        console.warn('Email notification failed (non-blocking):', err?.message ?? err);
        return of('failed');
      })
    );
  }

  // ── DTO → UI ──────────────────────────────────────────────────────────────
  private dtoToProposal(dto: any): ProjectProposal {
    const raw = dto ?? {};
    const deliveryDays = Number(raw.deliveryDays ?? raw.delivery_days ?? 0);
    return {
      id:                Number(raw.id),
      projectId:         Number(raw.projectId ?? raw.project_id ?? 0),
      freelancerId:      Number(raw.freelancerId ?? raw.freelancer_id ?? 0),
      coverLetter:       String(raw.coverLetter ?? raw.cover_letter ?? ''),
      proposedBudget:    Number(raw.proposedPrice ?? raw.proposed_price ?? 0),
      estimatedDuration: deliveryDays ? `${deliveryDays} day(s)` : (raw.estimatedDuration ?? ''),
      status:            this.normalizeStatus(raw.status),
      submittedAt:       raw.submittedAt ? new Date(raw.submittedAt) : new Date(),
      deliveryDays:      deliveryDays || undefined,
      isInvited:         Boolean(raw.isInvited ?? raw.is_invited),
      revisionsOffered:  Number(raw.revisionsOffered ?? raw.revisions_offered ?? 0)
    };
  }

  // ── UI → payload API ──────────────────────────────────────────────────────
  private toPayload(p: Partial<ProjectProposal>): ProposalApi | Partial<ProposalApi> {
    const deliveryDays =
      p.deliveryDays ?? ((typeof p.estimatedDuration === 'string'
        ? parseInt(p.estimatedDuration, 10) : 0) || 0);
    return {
      projectId:        p.projectId!,
      freelancerId:     p.freelancerId!,
      proposedPrice:    p.proposedBudget ?? (p as any).proposedPrice ?? 0,
      deliveryDays:     Number(deliveryDays) || 0,
      coverLetter:      p.coverLetter ?? '',
      status:           p.status ?? 'PENDING',
      isInvited:        p.isInvited ?? false,
      revisionsOffered: p.revisionsOffered ?? 0
    };
  }

  private normalizeStatus(value: any): ProposalStatus {
    const v = String(value ?? '').toUpperCase();
    if (['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(v))
      return v as ProposalStatus;
    return 'PENDING';
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  getByProject(projectId: number, sort?: 'priceDesc' | 'durationDesc'): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetProposalsByProject/${projectId}`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      map((items) => {
        if (sort === 'priceDesc')
          return [...items].sort((a, b) => b.proposedBudget - a.proposedBudget);
        if (sort === 'durationDesc')
          return [...items].sort((a, b) => (b.deliveryDays ?? 0) - (a.deliveryDays ?? 0));
        return items;
      }),
      catchError(() => of([]))
    );
  }

  getByFreelancer(freelancerId: number): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetProposalsByFreelancer/${freelancerId}`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      catchError(() => of([]))
    );
  }

  getAllProposals(): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllProposals`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      catchError(() => of([]))
    );
  }

  getProposalsForClient(clientId: number): Observable<ProjectProposal[]> {
    return this.projectService.getByClient(clientId, 1, 500).pipe(
      switchMap((res) => {
        const projectIds = res.items.map((p) => p.id);
        if (projectIds.length === 0) return of([]);
        return this.http.get<any[]>(`${this.baseUrl}/GetAllProposals`).pipe(
          map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
          map((all) => all.filter((p) => projectIds.includes(p.projectId)))
        );
      }),
      catchError(() => of([]))
    );
  }

  getById(id: number): Observable<ProjectProposal | undefined> {
    return this.http.get<any>(`${this.baseUrl}/GetProposal/${id}`).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError(() => of(undefined))
    );
  }

  // ── CREATE — puis notifie le client par email ─────────────────────────────
  create(input: Omit<ProjectProposal, 'id' | 'status' | 'submittedAt'>): Observable<ProjectProposal> {
    const payload = this.toPayload(input) as ProposalApi;
    return this.http.post<any>(`${this.baseUrl}/AddProposal`, payload).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError((err) => {
        console.error('AddProposal error:', err);
        throw err;
      })
    );
  }

  update(id: number, patch: Partial<ProjectProposal>): Observable<ProjectProposal | undefined> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        if (!existing) return of(undefined);
        const payload = this.toPayload({ ...existing, ...patch }) as ProposalApi;
        payload.id = id;
        return this.http.put<any>(`${this.baseUrl}/UpdateProposal/${id}`, payload).pipe(
          map((dto) => this.dtoToProposal(dto)),
          catchError(() => of(undefined))
        );
      })
    );
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteProposal/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  accept(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'ACCEPTED' }).pipe(
      switchMap((proposal) => {
        if (!proposal) return of(undefined);
        return this.projectService.update(proposal.projectId, { status: Status.ARCHIVED }).pipe(
          map(() => proposal),
          catchError(() => of(proposal))
        );
      })
    );
  }

  reject(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'REJECTED' });
  }

  cancel(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'REJECTED' });
  }

  withdraw(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'WITHDRAWN' });
  }

  hide(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { hiddenByClient: true } as Partial<ProjectProposal>);
  }

  /** Accepted proposals = contracts (proposal ID = contract ID for milestones) */
  getAcceptedContractsForClient(clientId: number): Observable<ProjectProposal[]> {
    return this.getProposalsForClient(clientId).pipe(
      map((list) => list.filter((p) => p.status === 'ACCEPTED'))
    );
  }

  getAcceptedContractsForFreelancer(freelancerId: number): Observable<ProjectProposal[]> {
    return this.getByFreelancer(freelancerId).pipe(
      map((list) => list.filter((p) => p.status === 'ACCEPTED'))
    );
  }

  /** All accepted proposals (for admin) */
  getAcceptedContractsForAdmin(): Observable<ProjectProposal[]> {
    return this.getAllProposals().pipe(
      map((list) => list.filter((p) => p.status === 'ACCEPTED'))
    );
  }

  getFreelancerStats(freelancerId: number): Observable<FreelancerProposalStats> {
    return this.getByFreelancer(freelancerId).pipe(
      map((my) => {
        const accepted = my.filter((p) => p.status === 'ACCEPTED').length;
        const total    = my.length;
        return {
          freelancerId,
          totalProposals:    total,
          acceptedProposals: accepted,
          acceptanceRate:    total ? accepted / total : 0
        };
      }),
      catchError(() => of({
        freelancerId,
        totalProposals: 0,
        acceptedProposals: 0,
        acceptanceRate: 0
      }))
    );
  }
}