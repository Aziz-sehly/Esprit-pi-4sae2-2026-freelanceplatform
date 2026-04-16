import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, authHttpErrorMessage } from '../../front/services/auth.service';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <h2>Sign in</h2>
        <p class="hint">Access front office or back office based on your role.</p>
        <form (ngSubmit)="submit()" class="auth-form">
          <input [(ngModel)]="usernameOrEmail" name="usernameOrEmail" placeholder="Username or email" required />
          <input [(ngModel)]="password" name="password" type="password" placeholder="Password" required />
          <button type="submit" [disabled]="loading">{{ loading ? '...' : 'Login' }}</button>
          <p class="error" *ngIf="error">{{ error }}</p>
          <p class="muted">No account? <a routerLink="/front/register">Register</a></p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .auth-card {
      width: min(420px, 100%);
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
    }
    .hint { color: #6b7280; margin-top: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.65rem 0.75rem; }
    button { border: none; border-radius: 8px; padding: 0.7rem; background: #2563eb; color: #fff; cursor: pointer; }
    .error { color: #dc2626; margin: 0; font-size: 0.9rem; }
    .muted { color: #6b7280; margin: 0; font-size: 0.9rem; }
    a { color: #2563eb; }
  `]
})
export class LoginRedirectComponent {
  usernameOrEmail = '';
  password = '';
  loading = false;
  error = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  submit(): void {
    this.error = '';
    this.loading = true;
    this.authService.login(this.usernameOrEmail.trim(), this.password).subscribe({
      next: (user) => {
        this.loading = false;
        this.router.navigateByUrl(user.role === 'ADMIN' ? '/back/admin-messages' : '/front');
      },
      error: (err) => {
        this.loading = false;
        this.error = authHttpErrorMessage(err, 'Sign in failed');
      }
    });
  }
}
