import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

// ── Enums (Matching Java Backend) ───────────────────────────────────────

export type ContractStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXTENDED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type ExtensionStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type ExtensionType = 
  | 'COMPLEXITY_UNDERESTIMATED'
  | 'FREELANCER_DELAY'
  | 'CLIENT_DELAY'
  | 'SCOPE_CHANGE'
  | 'FORCE_MAJEURE'
  | 'MUTUAL_AGREEMENT';

export type RequestingParty = 'CLIENT' | 'FREELANCER';

export type PaymentStructure = 'FIXED' | 'MILESTONE' | 'HOURLY';

// ── Contract DTOs ──────────────────────────────────────────────────────────

export interface ContractSignature {
  id: number;
  contractId: number;
  signerId: number;
  signerRole: string;
  signerEmail: string;
  signerName: string;
  status: string;
  signatureData?: string;
  token?: string;
  ipAddress?: string;
  signedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface ContractExtension {
  id: number;
  contractId: number;
  additionalDays: number;
  extensionType?: ExtensionType;
  requestingParty?: RequestingParty;
  status: ExtensionStatus;
  proposedAmount?: number;
  suggestedAmount?: number;
  requesterNote?: string;
  responderNote?: string;
  riskAlerts?: string;
  requestedAt?: string;
  resolvedAt?: string;
}

export interface Contract {
  id: number;
  projectId: number;
  proposalId: number;
  freelancerId: number;
  clientId: number;
  amount: number;
  platformFeePercentage: number;
  paymentStructure?: PaymentStructure;
  status: ContractStatus;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  extensions: ContractExtension[];
  signatures: ContractSignature[];
  /** Display-only fields — populated client-side after loading, not returned by the API. */
  title?: string;
  scope?: string;
  totalBudget?: number;
  clientName?: string;
  freelancerName?: string;
  respondedAt?: string;
}

// ── Request DTOs ───────────────────────────────────────────────────────────

export interface ExtensionCreateRequest {
  additionalDays: number;
  extensionType?: ExtensionType;
  requestingParty: RequestingParty;
  requesterNote?: string;
  proposedAmount?: number;
}

export interface ExtensionReviewRequest {
  status: ExtensionStatus;
  responderNote?: string;
  suggestedAmount?: number;
  riskAlerts?: string;
}

export interface VerifyContractResponse {
  contractId: number;
  valid: boolean;
  status: string;
  message: string;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ContractService {

  private readonly BASE = environment.contractApiBase;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getAllContracts(status?: ContractStatus): Observable<Contract[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Contract[]>(this.BASE, { headers: this.headers(), params });
  }

  getContractById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.BASE}/${id}`, { headers: this.headers() });
  }

  getContractsByClient(clientId: number, status?: ContractStatus): Observable<Contract[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Contract[]>(`${this.BASE}/client/${clientId}`, { headers: this.headers(), params });
  }

  getContractsByFreelancer(freelancerId: number, status?: ContractStatus): Observable<Contract[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Contract[]>(`${this.BASE}/freelancer/${freelancerId}`, { headers: this.headers(), params });
  }

  getContractByProposal(proposalId: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.BASE}/proposal/${proposalId}`, { headers: this.headers() });
  }

  getPdfUrl(contractId: number): string {
    return `${this.BASE}/${contractId}/pdf`;
  }

  downloadPdf(contractId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/${contractId}/pdf`, {
      headers: this.headers(),
      responseType: 'blob'
    });
  }

  verifyContract(contractId: number, code: string): Observable<VerifyContractResponse> {
    return this.http.get<VerifyContractResponse>(
      `${this.BASE}/${contractId}/verify`,
      { headers: this.headers(), params: new HttpParams().set('code', code) }
    );
  }

  getExtensions(contractId: number, pendingOnly = false): Observable<ContractExtension[]> {
    const params = new HttpParams().set('pendingOnly', pendingOnly);
    return this.http.get<ContractExtension[]>(
      `${this.BASE}/${contractId}/extensions`,
      { headers: this.headers(), params }
    );
  }

  requestExtension(contractId: number, req: ExtensionCreateRequest): Observable<ContractExtension> {
    return this.http.post<ContractExtension>(
      `${this.BASE}/${contractId}/extensions`,
      req,
      { headers: this.headers() }
    );
  }

  reviewExtension(
    contractId: number,
    extensionId: number,
    req: ExtensionReviewRequest
  ): Observable<ContractExtension> {
    return this.http.patch<ContractExtension>(
      `${this.BASE}/${contractId}/extensions/${extensionId}/review`,
      req,
      { headers: this.headers() }
    );
  }

  /** Alias for getContractById — matches the method name used by milestone/workspace components. */
  getById(id: number): Observable<Contract> {
    return this.getContractById(id);
  }

  /**
   * All contracts where userId is either client OR freelancer, deduplicated.
   */
  getAllForUser(userId: number): Observable<Contract[]> {
    return forkJoin([
      this.getContractsByClient(userId).pipe(catchError(() => of([] as Contract[]))),
      this.getContractsByFreelancer(userId).pipe(catchError(() => of([] as Contract[]))),
    ]).pipe(
      map(([asClient, asFreelancer]) => {
        const seen = new Set<number>();
        const merged: Contract[] = [];
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

  /**
   * Populate display-only fields (title, totalBudget, clientName, freelancerName)
   * on a Contract loaded from the API.
   */
  enrichForDisplay(contract: Contract): void {
    contract.title = contract.title || `Contract #${contract.id}`;
    contract.totalBudget = contract.totalBudget ?? contract.amount;
    contract.scope = contract.scope || (contract.paymentStructure ? `${contract.paymentStructure} payment` : '');

    if (!contract.clientName) {
      this.auth.getPublicUser(contract.clientId).subscribe(u => {
        contract.clientName = [u.firstName, u.lastName].filter(Boolean).join(' ') || `Client #${contract.clientId}`;
      });
    }
    if (!contract.freelancerName) {
      this.auth.getPublicUser(contract.freelancerId).subscribe(u => {
        contract.freelancerName = [u.firstName, u.lastName].filter(Boolean).join(' ') || `Freelancer #${contract.freelancerId}`;
      });
    }
  }

  updateStatus(id: number, status: ContractStatus): Observable<Contract> {
    return this.http.patch<Contract>(
      `${this.BASE}/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }
}