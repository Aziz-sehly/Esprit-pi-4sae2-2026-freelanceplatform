import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  token: string;
}

interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

/**
 * Normalizes Angular {@link HttpErrorResponse} and plain error-shaped objects into `{ status, error }`.
 */
function httpErrorLike(err: unknown): { status: number; error: unknown } | null {
  if (err instanceof HttpErrorResponse) {
    return { status: err.status, error: err.error };
  }
  if (err === null || typeof err !== 'object') return null;
  const o = err as { status?: unknown; error?: unknown };
  return typeof o.status === 'number' ? { status: o.status, error: o.error } : null;
}

/** Reads Spring Boot / gateway / ProblemDetail JSON (user-service also maps errors to `{ message }`). */
export function authHttpErrorMessage(err: unknown, fallback: string): string {
  const httpErr = httpErrorLike(err);
  if (!httpErr) return fallback;
  if (httpErr.status === 0) {
    return 'Cannot reach the server. Check that the API gateway is running (port 8080).';
  }

  let body: unknown = httpErr.error;
  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) {
      return fallback;
    }
    if (t.startsWith('{')) {
      try {
        body = JSON.parse(t) as Record<string, unknown>;
      } catch {
        return t.length > 280 ? `${t.slice(0, 280)}…` : t;
      }
    } else {
      return t.length > 280 ? `${t.slice(0, 280)}…` : t;
    }
  }

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const rec = body as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error', 'title'] as const) {
      const v = rec[key];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
  }

  return fallback;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.production ? `${environment.prolanceGatewayUrl}/users` : '/users';
  private readonly storageKey = 'prolance-auth-user';
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) {
    this.restoreSession();
  }

  login(usernameOrEmail: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { usernameOrEmail, password }).pipe(
      tap((resp) => this.setSession(resp))
    );
  }

  register(payload: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload).pipe(
      tap((resp) => this.setSession(resp))
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.currentUserSubject.next(null);
    this.router.navigateByUrl('/front');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.token;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  refreshUser(): void {
    if (!this.isAuthenticated()) return;
    this.http.get<{
      id: number;
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
    }>(`${this.baseUrl}/me`).subscribe({
      next: (u) => {
        const existing = this.currentUserSubject.value;
        if (!existing) return;
        this.setSession({ ...u, token: existing.token });
      },
      error: () => this.logout()
    });
  }

  hasRole(role: string): boolean {
    const currentRole = this.currentUserSubject.value?.role;
    return currentRole?.toUpperCase() === role.toUpperCase();
  }

  getToken(): string | undefined {
    return this.currentUserSubject.value?.token;
  }

  getNumericUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthUser;
      if (!parsed?.token || !parsed?.id) return;
      this.currentUserSubject.next(parsed);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private setSession(response: AuthResponse): void {
    const user: AuthUser = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      token: response.token
    };
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
