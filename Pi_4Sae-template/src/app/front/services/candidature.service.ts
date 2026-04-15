import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FreelancerPreferences } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CandidatureService {
  private readonly baseUrl = `${environment.businessApiGatewayUrl}/candidature`;

  constructor(private readonly http: HttpClient) {}

  private dtoToPreferences(dto: any): FreelancerPreferences {
    const raw = dto ?? {};
    const skills = Array.isArray(raw.skills) ? raw.skills : (raw.skills ? String(raw.skills).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    const preferredProjectTypes = Array.isArray(raw.preferredProjectTypes)
      ? raw.preferredProjectTypes
      : (raw.preferredProjectTypes ? String(raw.preferredProjectTypes).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    return {
      id: raw.id,
      freelancerId: Number(raw.freelancerId ?? raw.freelancer_id ?? 0),
      skills,
      preferredProjectTypes,
      minBudget: Number(raw.minBudget ?? raw.min_budget ?? 0),
      maxBudget: Number(raw.maxBudget ?? raw.max_budget ?? 0),
      avgDeliveryDays: Number(raw.avgDeliveryDays ?? raw.avg_delivery_days ?? 0),
      openToNegotiation: Boolean(raw.openToNegotiation ?? raw.open_to_negotiation ?? false),
      openToOtherProjectTypes: Boolean(raw.openToOtherProjectTypes ?? raw.open_to_other_project_types ?? false),
      notes: raw.notes ?? ''
    };
  }

  getAll(): Observable<FreelancerPreferences[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToPreferences(dto))),
      catchError(() => of([]))
    );
  }

  getByFreelancer(freelancerId: number): Observable<FreelancerPreferences | null> {
    return this.http.get<any>(`${this.baseUrl}/${freelancerId}`).pipe(
      map((dto) => this.dtoToPreferences(dto)),
      catchError(() => of(null))
    );
  }

  create(freelancerId: number, preferences: Omit<FreelancerPreferences, 'id' | 'freelancerId'>): Observable<FreelancerPreferences | null> {
    const payload = this.preferencesToPayload(preferences);
    return this.http.post<any>(`${this.baseUrl}/${freelancerId}`, payload).pipe(
      map((dto) => this.dtoToPreferences(dto)),
      catchError(() => of(null))
    );
  }

  update(freelancerId: number, preferences: Partial<FreelancerPreferences>): Observable<FreelancerPreferences | null> {
    const payload = this.preferencesToPayload(preferences);
    return this.http.put<any>(`${this.baseUrl}/${freelancerId}`, payload).pipe(
      map((dto) => this.dtoToPreferences(dto)),
      catchError(() => of(null))
    );
  }

  delete(freelancerId: number): Observable<boolean> {
    return this.http.delete<void>(`${this.baseUrl}/${freelancerId}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private preferencesToPayload(p: Partial<FreelancerPreferences>): any {
    return {
      skills: p.skills ?? [],
      preferredProjectTypes: p.preferredProjectTypes ?? [],
      minBudget: p.minBudget,
      maxBudget: p.maxBudget,
      avgDeliveryDays: p.avgDeliveryDays,
      openToNegotiation: p.openToNegotiation ?? false,
      openToOtherProjectTypes: p.openToOtherProjectTypes ?? false,
      notes: p.notes ?? null
    };
  }
}
