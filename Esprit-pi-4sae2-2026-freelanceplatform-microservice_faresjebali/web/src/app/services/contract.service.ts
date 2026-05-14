import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContractRequest, ContractResponse, ContractStatus } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly base = `${environment.apiGateway}/milestone/api/contracts`;

  constructor(private readonly http: HttpClient) {}

  create(req: ContractRequest): Observable<ContractResponse> {
    return this.http.post<ContractResponse>(this.base, req);
  }

  getById(id: number): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.base}/${id}`);
  }

  list(filters: { clientId?: number; freelancerId?: number; status?: ContractStatus }): Observable<ContractResponse[]> {
    let params = new HttpParams();

    if (filters.clientId != null) {
      params = params.set('clientId', filters.clientId);
    }
    if (filters.freelancerId != null) {
      params = params.set('freelancerId', filters.freelancerId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<ContractResponse[]>(this.base, { params });
  }

  accept(id: number): Observable<ContractResponse> {
    return this.http.patch<ContractResponse>(`${this.base}/${id}/accept`, {});
  }

  reject(id: number): Observable<ContractResponse> {
    return this.http.patch<ContractResponse>(`${this.base}/${id}/reject`, {});
  }

  complete(id: number): Observable<ContractResponse> {
    return this.http.patch<ContractResponse>(`${this.base}/${id}/complete`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
