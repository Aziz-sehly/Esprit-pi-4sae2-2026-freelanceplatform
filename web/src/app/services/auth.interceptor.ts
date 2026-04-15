import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'authToken';
const AUTH_BYPASS_PATTERNS = [
  '/user/api/auth/login',
  '/user/api/auth/register',
  '/user/api/auth/verify-email',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  const shouldBypass = AUTH_BYPASS_PATTERNS.some((pattern) => req.url.includes(pattern));

  if (!token || shouldBypass) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }));
};
