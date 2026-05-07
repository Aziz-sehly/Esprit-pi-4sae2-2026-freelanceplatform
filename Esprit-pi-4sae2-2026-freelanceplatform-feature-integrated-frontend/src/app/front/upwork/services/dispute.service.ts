import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Contract } from '../../services/Contract.service';
import {
  DisputeApi,
  DisputeCreateRequest,
  DisputeDecisionRequest,
  DisputeResponse,
  DisputeStatus,
} from '../models/dispute.model';

@Injectable({ providedIn: 'root' })
export class DisputeService {
  private readonly base = `${environment.disputeApiBase}/api/disputes`;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  private toApiStatus(s?: DisputeStatus): string | undefined {
    if (!s) {
      return undefined;
    }
    return s === 'UNDER_REVIEW' ? 'IN_REVIEW' : s;
  }

  private toDisputeResponse(d: DisputeApi, c: Contract): DisputeResponse {
    const openedByName =
      d.raisedByUserId === c.clientId
        ? `Client #${c.clientId}`
        : d.raisedByUserId === c.freelancerId
          ? `Freelancer #${c.freelancerId}`
          : `User #${d.raisedByUserId}`;
    const st = (d.status === 'IN_REVIEW' ? 'UNDER_REVIEW' : d.status) as DisputeStatus;
    return {
      id: d.id,
      contractId: d.contractId,
      milestoneId: null,
      paymentId: null,
      reason: 'OTHER',
      status: st,
      openedByRole: d.raisedByUserId === c.clientId ? 'CLIENT' : 'FREELANCER',
      openedById: d.raisedByUserId,
      openedByName,
      title: d.disputeType,
      description: d.reason,
      resolutionNote: d.resolutionNote ?? null,
      createdAt: d.createdAt,
      updatedAt: d.resolvedAt ?? d.createdAt,
      resolvedAt: d.resolvedAt ?? null,
    };
  }

  list(contractId: number, contract: Contract, status?: DisputeStatus): Observable<DisputeResponse[]> {
    let params = new HttpParams().set('contractId', contractId);
    const apiSt = this.toApiStatus(status);
    if (apiSt) {
      params = params.set('status', apiSt);
    }
    return this.http.get<DisputeApi[]>(this.base, { params }).pipe(
      map((rows) => (rows ?? []).map((d) => this.toDisputeResponse(d, contract))),
    );
  }

  create(req: DisputeCreateRequest, contract: Contract): Observable<DisputeResponse> {
    const otherId = req.openedByRole === 'CLIENT' ? contract.freelancerId : contract.clientId;
    const reason =
      `[${req.reason}] ${req.description}` +
      (req.milestoneId != null ? `\nRelated milestone id: ${req.milestoneId}` : '') +
      (req.paymentId != null ? `\nPayment id: ${req.paymentId}` : '');
    const body = {
      contractId: req.contractId,
      contactUserId: otherId,
      disputeType: req.title.trim(),
      reason: reason.trim(),
    };
    return this.http.post<DisputeApi>(this.base, body).pipe(map((d) => this.toDisputeResponse(d, contract)));
  }

  hasBlockingDispute(contractId: number): Observable<{ blocking: boolean }> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<{ blocking: boolean }>(`${this.base}/blocking`, { params });
  }

  review(id: number, req: DisputeDecisionRequest, contract: Contract): Observable<DisputeResponse> {
    return this.patchResolve(id, 'IN_REVIEW', req.note, contract);
  }

  resolve(id: number, req: DisputeDecisionRequest, contract: Contract): Observable<DisputeResponse> {
    return this.patchResolve(id, 'RESOLVED', req.note, contract);
  }

  reject(id: number, req: DisputeDecisionRequest, contract: Contract): Observable<DisputeResponse> {
    return this.patchResolve(id, 'REJECTED', req.note, contract);
  }

  private patchResolve(
    id: number,
    status: 'IN_REVIEW' | 'RESOLVED' | 'REJECTED',
    note: string,
    contract: Contract,
  ): Observable<DisputeResponse> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const body = {
      resolvedByUserId: user.id,
      status,
      resolutionNote: note,
    };
    return this.http
      .patch<DisputeApi>(`${this.base}/${id}/resolve`, body)
      .pipe(map((d) => this.toDisputeResponse(d, contract)));
  }
}
