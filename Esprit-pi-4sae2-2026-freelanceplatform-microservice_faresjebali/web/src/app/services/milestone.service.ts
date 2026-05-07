import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  MilestoneFeedbackRequest,
  MilestoneRequest,
  MilestoneResponse,
} from '../models/milestone.model';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private readonly base = `${environment.apiGateway}/milestone/api`;

  constructor(private readonly http: HttpClient) {}

  listByContractId(contractId: number): Observable<MilestoneResponse[]> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<MilestoneResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<MilestoneResponse> {
    return this.http.get<MilestoneResponse>(`${this.base}/${id}`);
  }

  create(req: MilestoneRequest): Observable<MilestoneResponse> {
    return this.http.post<MilestoneResponse>(this.base, req);
  }

  update(id: number, req: MilestoneRequest): Observable<MilestoneResponse> {
    return this.http.put<MilestoneResponse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  approve(id: number): Observable<MilestoneResponse> {
    return this.http.patch<MilestoneResponse>(`${this.base}/${id}/approve`, {});
  }

  requestRevision(id: number, req: MilestoneFeedbackRequest): Observable<MilestoneResponse> {
    return this.http.patch<MilestoneResponse>(`${this.base}/${id}/request-revision`, req);
  }

  submit(id: number): Observable<MilestoneResponse> {
    return this.http.patch<MilestoneResponse>(`${this.base}/${id}/submit`, {});
  }
}
