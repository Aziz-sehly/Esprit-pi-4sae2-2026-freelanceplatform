import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly tokenStorageKey = 'authToken';
  private static readonly userStorageKey = 'currentUser';
  private static readonly personas: Record<'client' | 'freelancer', User> = {
    client: {
      id: 2,
      email: 'client@test.local',
      firstName: 'Client',
      lastName: 'Demo',
      userType: 'client',
      isVerified: true,
      isActive: true,
    },
    freelancer: {
      id: 6,
      email: 'freelancer@test.local',
      firstName: 'Freelancer',
      lastName: 'Demo',
      userType: 'freelancer',
      isVerified: true,
      isActive: true,
    },
  };

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    if (!this.currentUserSubject.value) {
      this.usePersona('freelancer');
    }
  }

  login(email: string, password: string): Observable<User> {
    const normalized = email.trim().toLowerCase();
    const persona = normalized.includes('client') ? 'client' : 'freelancer';
    return of(this.usePersona(persona));
  }

  register(userData: Partial<User> & { password?: string }): Observable<string> {
    const persona = userData.userType === 'client' ? 'client' : 'freelancer';
    this.usePersona(persona);
    return of('Development persona selected. You can start testing immediately.');
  }

  restoreSession(): Observable<User | null> {
    return of(this.currentUserSubject.value);
  }

  logout(): void {
    this.usePersona('freelancer');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  usePersona(persona: 'client' | 'freelancer'): User {
    const user = { ...AuthService.personas[persona] };
    return this.persistSession(this.buildDevToken(user), user);
  }

  private persistSession(token: string, user: User): User {
    localStorage.setItem(AuthService.tokenStorageKey, token);
    localStorage.setItem(AuthService.userStorageKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return user;
  }

  private clearSession(): void {
    localStorage.removeItem(AuthService.userStorageKey);
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(AuthService.userStorageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(AuthService.userStorageKey);
      return null;
    }
  }

  private buildDevToken(user: User): string {
    const header = this.base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const payload = this.base64UrlEncode({
      role: user.userType.toUpperCase(),
      userId: user.id,
      sub: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });
    return `${header}.${payload}.dev-signature`;
  }

  private base64UrlEncode(value: object): string {
    return btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
}
