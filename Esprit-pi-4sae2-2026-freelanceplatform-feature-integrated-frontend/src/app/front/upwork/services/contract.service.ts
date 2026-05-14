import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContractRequest, ContractResponse, ContractStatus } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly base = `${environment.milestoneApiBase}/api/contracts`;

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

  /**
   * Charge tous les contrats où userId intervient (comme client OU freelance).
   * Déduplique par id de contrat.
   */
  listAllForUser(userId: number): Observable<ContractResponse[]> {
    return forkJoin([
      this.list({ clientId: userId }).pipe(catchError(() => of([] as ContractResponse[]))),
      this.list({ freelancerId: userId }).pipe(catchError(() => of([] as ContractResponse[]))),
    ]).pipe(
      map(([asClient, asFreelancer]) => {
        const seen = new Set<number>();
        const merged: ContractResponse[] = [];
        for (const c of [...asClient, ...asFreelancer]) {
          if (c && !seen.has(c.id)) {
            seen.add(c.id);
            merged.push(c);
          }
        }
        return merged;
      }),
    );
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
