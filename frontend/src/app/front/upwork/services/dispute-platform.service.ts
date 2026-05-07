import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AuditEvent,
  CreateDisputeRequest,
  Dispute,
  DisputeDetailsResponse,
  DisputeInsightsResponse,
  DisputeStatus,
  Evidence,
  EvidenceCreateRequest,
  EvidenceUpdateRequest,
  ResolveDisputeRequest,
  UpdateDisputeRequest,
} from '../models/communication';

/**
 * Client HTTP complet pour dispute-service (/api/disputes).
 * Distinct du {@link DisputeService} « workspace » qui mappe vers le modèle UI simplifié.
 */
@Injectable({ providedIn: 'root' })
export class DisputePlatformService {
  private readonly baseUrl = `${environment.disputeApiBase}/api/disputes`;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateDisputeRequest): Observable<Dispute> {
    return this.http.post<Dispute>(this.baseUrl, request).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.create:', err);
        throw err;
      }),
    );
  }

  getById(id: number): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.getById:', err);
        throw err;
      }),
    );
  }

  list(contractId?: number, status?: DisputeStatus): Observable<Dispute[]> {
    let params = new HttpParams();
    if (contractId != null) params = params.set('contractId', String(contractId));
    if (status != null) params = params.set('status', status);
    return this.http.get<Dispute[]>(this.baseUrl, { params }).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.list:', err);
        return of([]);
      }),
    );
  }

  listAllForAdmin(
    contractId?: number,
    status?: DisputeStatus,
    sort: 'created' | 'escalation' = 'created',
  ): Observable<Dispute[]> {
    let params = new HttpParams();
    if (contractId != null) params = params.set('contractId', String(contractId));
    if (status != null) params = params.set('status', status);
    params = params.set('sort', sort);
    return this.http.get<Dispute[]>(`${this.baseUrl}/admin`, { params }).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.listAllForAdmin:', err);
        return of([]);
      }),
    );
  }

  getDetails(id: number): Observable<DisputeDetailsResponse> {
    return this.http.get<DisputeDetailsResponse>(`${this.baseUrl}/${id}/details`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.getDetails:', err);
        throw err;
      }),
    );
  }

  getInsights(id: number): Observable<DisputeInsightsResponse> {
    return this.http.get<DisputeInsightsResponse>(`${this.baseUrl}/${id}/insights`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.getInsights:', err);
        throw err;
      }),
    );
  }

  resolve(id: number, request: ResolveDisputeRequest): Observable<Dispute> {
    return this.http.patch<Dispute>(`${this.baseUrl}/${id}/resolve`, request).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.resolve:', err);
        throw err;
      }),
    );
  }

  update(id: number, request: UpdateDisputeRequest, currentUserId: number): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.baseUrl}/${id}`, request, {
      params: { currentUserId: String(currentUserId) },
    }).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.update:', err);
        throw err;
      }),
    );
  }

  delete(id: number, currentUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { currentUserId: String(currentUserId) },
    }).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.delete:', err);
        throw err;
      }),
    );
  }

  adminUpdate(id: number, request: UpdateDisputeRequest): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.baseUrl}/admin/${id}`, request).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.adminUpdate:', err);
        throw err;
      }),
    );
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/${id}`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.adminDelete:', err);
        throw err;
      }),
    );
  }

  listEvidence(disputeId: number): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(`${this.baseUrl}/${disputeId}/evidence`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.listEvidence:', err);
        return of([]);
      }),
    );
  }

  addEvidence(disputeId: number, payload: EvidenceCreateRequest): Observable<Evidence> {
    return this.http.post<Evidence>(`${this.baseUrl}/${disputeId}/evidence`, payload).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.addEvidence:', err);
        throw err;
      }),
    );
  }

  updateEvidence(disputeId: number, evidenceId: number, payload: EvidenceUpdateRequest): Observable<Evidence> {
    return this.http.put<Evidence>(`${this.baseUrl}/${disputeId}/evidence/${evidenceId}`, payload).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.updateEvidence:', err);
        throw err;
      }),
    );
  }

  deleteEvidence(disputeId: number, evidenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${disputeId}/evidence/${evidenceId}`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.deleteEvidence:', err);
        throw err;
      }),
    );
  }

  listAudit(disputeId: number): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/${disputeId}/audit`).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.listAudit:', err);
        return of([]);
      }),
    );
  }

  adminUpdateEvidenceMetadata(
    disputeId: number,
    evidenceId: number,
    payload: { category?: string | null; adminNote?: string | null },
  ): Observable<Evidence> {
    return this.http.patch<Evidence>(`${this.baseUrl}/${disputeId}/evidence/${evidenceId}`, payload).pipe(
      catchError((err) => {
        console.error('DisputePlatformService.adminUpdateEvidenceMetadata:', err);
        throw err;
      }),
    );
  }
}
