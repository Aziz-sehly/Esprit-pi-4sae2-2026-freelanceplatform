import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../front/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  // Login / register : ne jamais envoyer de Bearer (même jeton périmé → la gateway OAuth2 peut répondre 403).
  const isPublicAuth =
    req.url.includes('/users/auth/login')
    || req.url.includes('/users/auth/register')
    || req.url.includes('/api/auth/login')
    || req.url.includes('/api/auth/register');
  if (isPublicAuth) {
    const headers = req.headers.delete('Authorization');
    return next(req.clone({ headers }));
  }

  if (!token) return next(req);

  const isLocalApi = req.url.startsWith('/messages')
    || req.url.startsWith('/disputes')
    || req.url.startsWith('/users')
    || req.url.includes('localhost:8080')
    || (!!environment.prolanceGatewayUrl && req.url.startsWith(environment.prolanceGatewayUrl));

  if (!isLocalApi) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
