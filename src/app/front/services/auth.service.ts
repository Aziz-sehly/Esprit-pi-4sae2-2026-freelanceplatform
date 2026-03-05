import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Keycloak from 'keycloak-js';
import { User } from '../models/models';

/** Service d'authentification basé sur Keycloak */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloak = inject(Keycloak) as Keycloak;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.updateUserFromKeycloak();
  }

  private updateUserFromKeycloak(): void {
    if (this.keycloak?.authenticated && this.keycloak.tokenParsed) {
      const parsed = this.keycloak.tokenParsed as Record<string, unknown>;
      const user: User = {
        id: String(parsed['sub'] ?? ''),
        email: String(parsed['email'] ?? parsed['preferred_username'] ?? ''),
        firstName: String(parsed['given_name'] ?? ''),
        lastName: String(parsed['family_name'] ?? ''),
        userType: 'freelancer',
        profileImage: undefined,
        createdAt: new Date()
      };
      this.currentUserSubject.next(user);
    } else {
      this.currentUserSubject.next(null);
    }
  }

  /** Redirige vers la page de login Keycloak */
  login(redirectUri?: string): Promise<void> {
    return this.keycloak.login({ redirectUri: redirectUri ?? window.location.href });
  }

  /** Inscription (redirige vers Keycloak registration) */
  register(redirectUri?: string): Promise<void> {
    return this.keycloak.register({ redirectUri: redirectUri ?? window.location.href });
  }

  /** Déconnexion - redirige vers la page d'accueil après logout */
  logout(redirectUri?: string): Promise<void> {
    this.currentUserSubject.next(null);
    const uri = redirectUri ?? `${window.location.origin}/front`;
    return this.keycloak.logout({ redirectUri: uri });
  }

  isAuthenticated(): boolean {
    return this.keycloak?.authenticated ?? false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Rafraîchit l'utilisateur depuis Keycloak (après login) */
  refreshUser(): void {
    this.updateUserFromKeycloak();
  }

  /** Vérifie si l'utilisateur a un rôle (insensible à la casse) */
  hasRole(role: string): boolean {
    const roles = this.keycloak?.realmAccess?.roles ?? [];
    const resourceRoles = Object.values(this.keycloak?.resourceAccess ?? {}).flatMap(r => r.roles ?? []);
    const allRoles = [...roles, ...resourceRoles].map(r => String(r).toLowerCase());
    return allRoles.includes(role.toLowerCase());
  }

  /** Token JWT pour les appels API */
  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  /**
   * Retourne un ID numérique pour les APIs qui attendent un Long.
   * Utilise un hash déterministe du sub Keycloak (UUID).
   * À remplacer par un appel à un user-service si disponible.
   */
  getNumericUserId(): number | null {
    const user = this.getCurrentUser();
    if (!user?.id) return null;
    const hex = user.id.replace(/-/g, '').substring(0, 8);
    const n = parseInt(hex, 16);
    return isNaN(n) ? 1 : Math.abs(n) || 1;
  }
}
