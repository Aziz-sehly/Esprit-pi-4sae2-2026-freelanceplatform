// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    const url = req.url;
    const isApi =
      url.startsWith(environment.gatewayBaseUrl) ||
      url.startsWith('/microservice-user') ||
      url.startsWith('/microservice-contract') ||
      url.startsWith('/milestone-service') ||
      url.startsWith('/payment-service') ||
      url.startsWith('/dispute-service') ||
      url.startsWith('/message-service') ||
      url.startsWith('/media-analysis-service') ||
      url.startsWith(environment.contractApiBase) ||
      url.startsWith(environment.milestoneApiBase) ||
      url.startsWith(environment.paymentApiBase) ||
      url.startsWith(environment.milestonePublicOrigin) ||
      url.startsWith(environment.disputeApiBase) ||
      url.startsWith(environment.messageApiBase) ||
      url.startsWith(environment.mediaAnalysisApiBase);

    /** Ne pas envoyer un JWT expiré sur login/register (évite refus côté sécurité / proxies). */
    const isPublicUserAuth =
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/verify-email');

    if (token && isApi && !isPublicUserAuth) {
      const headers: { [key: string]: string } = {
        Authorization: `Bearer ${token}`,
      };
      const user = this.authService.getCurrentUser();
      if (user) {
        headers['X-User-Id'] = String(user.id);
        headers['X-User-Roles'] = `ROLE_${user.role}`;
      }
      if (!(req.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      const cloned = req.clone({ setHeaders: headers });

      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            const failUrl = error.url || req.url || '';
            // Ne pas déconnecter sur un 401 d’un microservice (souvent config JWT / rôles) :
            // seul un refus explicite du user-service indique en général un token invalide.
            if (failUrl.includes('/microservice-user/')) {
              console.warn('Session invalide (401 user-service) — déconnexion locale');
              this.authService.logoutLocal();
            } else {
              console.warn('401 sur API:', failUrl);
            }
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(req);
  }
}