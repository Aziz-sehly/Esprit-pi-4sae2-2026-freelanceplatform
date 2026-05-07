import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DisputeCreateRequest,
  DisputeDecisionRequest,
  DisputeResponse,
  DisputeStatus,
} from '../models/dispute.model';

@Injectable({ providedIn: 'root' })
export class DisputeService {
  private readonly base = `${environment.apiGateway}/milestone/api/disputes`;

  constructor(private readonly http: HttpClient) {}

  list(contractId: number, status?: DisputeStatus): Observable<DisputeResponse[]> {
    let params = new HttpParams().set('contractId', contractId);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<DisputeResponse[]>(this.base, { params });
  }

  create(req: DisputeCreateRequest): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(this.base, req);
  }

  hasBlockingDispute(contractId: number): Observable<{ blocking: boolean }> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<{ blocking: boolean }>(`${this.base}/blocking`, { params });
  }

  review(id: number, req: DisputeDecisionRequest): Observable<DisputeResponse> {
    return this.http.patch<DisputeResponse>(`${this.base}/${id}/review`, req);
  }

  resolve(id: number, req: DisputeDecisionRequest): Observable<DisputeResponse> {
    return this.http.patch<DisputeResponse>(`${this.base}/${id}/resolve`, req);
  }

  reject(id: number, req: DisputeDecisionRequest): Observable<DisputeResponse> {
    return this.http.patch<DisputeResponse>(`${this.base}/${id}/reject`, req);
  }
}
