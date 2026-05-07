// guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthService } from '../front/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanActivateChild {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.check();
  }

  canActivateChild(): boolean | UrlTree {
    return this.check();
  }

  private check(): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      // Not logged in → send to login
      return this.router.createUrlTree(['/front/login']);
    }
    if (!this.auth.isAdmin()) {
      // Logged in but not admin → send to front home (or a 403 page)
      return this.router.createUrlTree(['/front/home']);
    }
    return true;
  }
}