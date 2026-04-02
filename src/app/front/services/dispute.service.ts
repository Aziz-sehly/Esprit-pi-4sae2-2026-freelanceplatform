import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Dispute,
  DisputeDetailsResponse,
  CreateDisputeRequest,
  UpdateDisputeRequest,
  ResolveDisputeRequest,
  DisputeStatus,
  Evidence,
  EvidenceCreateRequest,
  AuditEvent
} from '../models/communication';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DisputeService {
  /** Dev : proxy -> ProLance api-gateway :8080 */
  private readonly baseUrl = environment.production ? `${environment.prolanceGatewayUrl}/disputes` : '/disputes';

  constructor(private readonly http: HttpClient) {}

  create(request: CreateDisputeRequest): Observable<Dispute> {
    return this.http.post<Dispute>(this.baseUrl, request).pipe(
      catchError((err) => {
        console.error('DisputeService.create:', err);
        throw err;
      })
    );
  }

  getById(id: number): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('DisputeService.getById:', err);
        throw err;
      })
    );
  }

  /** Current user's disputes only (even if the account is ADMIN). */
  list(contractId?: number, status?: DisputeStatus): Observable<Dispute[]> {
    let params = new HttpParams();
    if (contractId != null) params = params.set('contractId', String(contractId));
    if (status != null) params = params.set('status', status);
    return this.http.get<Dispute[]>(this.baseUrl, { params }).pipe(
      catchError((err) => {
        console.error('DisputeService.list:', err);
        return of([]);
      })
    );
  }

  /** Back-office: all disputes (requires ADMIN; gateway → GET /disputes/admin). */
  listAllForAdmin(contractId?: number, status?: DisputeStatus): Observable<Dispute[]> {
    let params = new HttpParams();
    if (contractId != null) params = params.set('contractId', String(contractId));
    if (status != null) params = params.set('status', status);
    return this.http.get<Dispute[]>(`${this.baseUrl}/admin`, { params }).pipe(
      catchError((err) => {
        console.error('DisputeService.listAllForAdmin:', err);
        return of([]);
      })
    );
  }

  getDetails(id: number): Observable<DisputeDetailsResponse> {
    return this.http.get<DisputeDetailsResponse>(`${this.baseUrl}/${id}/details`).pipe(
      catchError((err) => {
        console.error('DisputeService.getDetails:', err);
        throw err;
      })
    );
  }

  resolve(id: number, request: ResolveDisputeRequest): Observable<Dispute> {
    return this.http.patch<Dispute>(`${this.baseUrl}/${id}/resolve`, request).pipe(
      catchError((err) => {
        console.error('DisputeService.resolve:', err);
        throw err;
      })
    );
  }

  update(id: number, request: UpdateDisputeRequest, currentUserId: number): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.baseUrl}/${id}`, request, {
      params: { currentUserId: String(currentUserId) }
    }).pipe(
      catchError((err) => {
        console.error('DisputeService.update:', err);
        throw err;
      })
    );
  }

  delete(id: number, currentUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { currentUserId: String(currentUserId) }
    }).pipe(
      catchError((err) => {
        console.error('DisputeService.delete:', err);
        throw err;
      })
    );
  }

  adminUpdate(id: number, request: UpdateDisputeRequest): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.baseUrl}/admin/${id}`, request).pipe(
      catchError((err) => {
        console.error('DisputeService.adminUpdate:', err);
        throw err;
      })
    );
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/${id}`).pipe(
      catchError((err) => {
        console.error('DisputeService.adminDelete:', err);
        throw err;
      })
    );
  }

  listEvidence(disputeId: number): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(`${this.baseUrl}/${disputeId}/evidence`).pipe(
      catchError((err) => {
        console.error('DisputeService.listEvidence:', err);
        return of([]);
      })
    );
  }

  addEvidence(disputeId: number, payload: EvidenceCreateRequest): Observable<Evidence> {
    return this.http.post<Evidence>(`${this.baseUrl}/${disputeId}/evidence`, payload).pipe(
      catchError((err) => {
        console.error('DisputeService.addEvidence:', err);
        throw err;
      })
    );
  }

  listAudit(disputeId: number): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/${disputeId}/audit`).pipe(
      catchError((err) => {
        console.error('DisputeService.listAudit:', err);
        return of([]);
      })
    );
  }

  adminUpdateEvidenceMetadata(disputeId: number, evidenceId: number, payload: { category?: string | null; adminNote?: string | null }): Observable<Evidence> {
    return this.http.patch<Evidence>(
      `${this.baseUrl}/${disputeId}/evidence/${evidenceId}`,
      payload
    ).pipe(
      catchError((err) => {
        console.error('DisputeService.adminUpdateEvidenceMetadata:', err);
        throw err;
      })
    );
  }
}
