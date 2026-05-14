import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:8085/microservice-contract';

export interface SignRequest {
  token: string;
  signatureData: string;
  ipAddress?: string;
}

export interface SignatureResponse {
  id: number;
  contractId: number;
  signerId: number;
  signerRole: string;
  signerEmail: string;
  signerName: string;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED';
  signatureData?: string;
  token: string;
  signedAt?: string;
  expiresAt?: string;
  createdAt: string;
  signed: boolean;
  signedByUserId?: number;
}

export interface AuthStatus {
  authenticated: boolean;
  email?: string;
  role?: string;
  userId?: number;
  message?: string;
}

export interface CanSignResponse {
  canSign: boolean;
  authenticated: boolean;
  message?: string;
  alreadySigned?: boolean;
  expired?: boolean;
  wrongUser?: boolean;
  requiresLogin?: boolean;
  loginUrl?: string;
  contractId?: number;
  signerRole?: string;
  signerEmail?: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractSigningService {
  private apiUrl = `${API_URL}/api/contracts`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  canSign(contractId: number, token: string): Observable<CanSignResponse> {
    return this.http.get<CanSignResponse>(
      `${this.apiUrl}/${contractId}/signatures/can-sign`,
      { params: { token } }
    );
  }

  getAuthStatus(contractId: number): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(
      `${this.apiUrl}/${contractId}/signatures/auth-status`
    );
  }

  getSignatureStatus(contractId: number): Observable<{ fullySigned: boolean }> {
    return this.http.get<{ fullySigned: boolean }>(
      `${this.apiUrl}/${contractId}/signatures/status`
    );
  }

  getSignatures(contractId: number): Observable<SignatureResponse[]> {
    return this.http.get<SignatureResponse[]>(
      `${this.apiUrl}/${contractId}/signatures`
    );
  }

  submitSignature(contractId: number, request: SignRequest): Observable<SignatureResponse> {
    if (!this.authService.isAuthenticated()) {
      const returnUrl = `/sign-contract/${contractId}?token=${request.token}`;
      this.router.navigate(['/front/login'], {
        queryParams: { redirect: returnUrl }
      });
      return throwError(() => new Error('Not authenticated'));
    }

    return this.http.post<SignatureResponse>(
      `${this.apiUrl}/${contractId}/signatures/sign`,
      request
    ).pipe(
      catchError(err => {
        if (err.status === 401) {
          this.authService.logoutLocal();
          const returnUrl = `/sign-contract/${contractId}?token=${request.token}`;
          this.router.navigate(['/front/login'], {
            queryParams: { redirect: returnUrl }
          });
        }
        return throwError(() => err);
      })
    );
  }
}