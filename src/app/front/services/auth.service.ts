// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { Router } from '@angular/router';

// ── DTOs matching Spring Boot backend ─────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'FREELANCER' | 'CLIENT';
  phoneNumber?: string;
  skills?: string;
  portfolioUrl?: string;
  companyName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  profilePicture?: string;
  bio?: string;
  phoneNumber?: string;
  skills?: string;
  portfolioUrl?: string;
  companyName?: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  profilePicture?: string;
  skills?: string;
  portfolioUrl?: string;
  companyName?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // All requests go through the API Gateway on port 8085
  private readonly BASE_URL = 'http://localhost:8085/microservice-user/api';

  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
        this.clearLocalData();
      }
    }
  }

  // ── Register ───────────────────────────────────────────────────────

  register(request: RegisterRequest): Observable<string> {
    return this.http.post<string>(
      `${this.BASE_URL}/auth/register`,
      request,
      { responseType: 'text' as 'json' }
    );
  }

  // ── Login ──────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    const request: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.BASE_URL}/auth/login`, request).pipe(
      tap(response => {
        if (response && response.token && response.user) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  // ── Update Profile ─────────────────────────────────────────────────

  updateProfile(id: number, request: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(
      `${this.BASE_URL}/users/${id}`,
      request,
      { headers: this.authHeaders() }
    ).pipe(
      tap(user => {
        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  // ── Get current user profile ───────────────────────────────────────

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${this.BASE_URL}/users/me`,
      { headers: this.authHeaders() }
    ).pipe(
      tap(user => {
        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  // ── Logout with Backend Call ───────────────────────────────────────

  logout(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      // If no token, just clear local data
      this.clearLocalData();
      this.router.navigate(['/front/login']);
      return of(null);
    }

    return this.http.post(
      `${this.BASE_URL}/auth/logout`,
      {},
      { headers: this.authHeaders(), responseType: 'text' as 'json' }
    ).pipe(
      tap(() => {
        console.log('Logout successful from backend');
        this.clearLocalData();
        this.router.navigate(['/front/login']);
      }),
      catchError((error) => {
        console.error('Logout error from backend:', error);
        // Even if backend call fails, clear local data
        this.clearLocalData();
        this.router.navigate(['/front/login']);
        return of(null);
      })
    );
  }

  // ── Simple Local Logout (no backend call) ──────────────────────────

  logoutLocal(): void {
    this.clearLocalData();
    this.router.navigate(['/login']);
  }

  // ── Clear All Local Data ───────────────────────────────────────────

  private clearLocalData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }

  // ── Helpers ────────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    // Optional: Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        this.clearLocalData();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getCurrentUser(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ADMIN';
  }

  isFreelancer(): boolean {
    return this.currentUserSubject.value?.role === 'FREELANCER';
  }

  isClient(): boolean {
    return this.currentUserSubject.value?.role === 'CLIENT';
  }

  /** Identifiant numérique pour les microservices (X-User-Id, message-service, dispute-service). */
  getNumericUserId(): number | null {
    const u = this.currentUserSubject.value;
    return u?.id ?? null;
  }

  hasRole(role: string): boolean {
    const currentRole = this.currentUserSubject.value?.role;
    return currentRole?.toUpperCase() === role.toUpperCase();
  }

  /** Profil minimal pour affichage (litiges, etc.). */
  getPublicUser(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.BASE_URL}/users/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(() =>
        of({
          id,
          email: '',
          firstName: '',
          lastName: '',
          role: 'CLIENT',
          isVerified: false,
          isActive: true,
        } as UserResponse),
      ),
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}