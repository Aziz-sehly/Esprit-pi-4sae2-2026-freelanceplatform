import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, authHttpErrorMessage } from '../../front/services/auth.service';

@Component({
  selector: 'app-register-redirect',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <h2>Create account</h2>
        <form (ngSubmit)="submit()" class="auth-form">
          <input [(ngModel)]="username" name="username" placeholder="Username" required />
          <input [(ngModel)]="email" name="email" type="email" placeholder="Email" required />
          <input [(ngModel)]="firstName" name="firstName" placeholder="First name" />
          <input [(ngModel)]="lastName" name="lastName" placeholder="Last name" />
          <input [(ngModel)]="password" name="password" type="password" placeholder="Password (min 6)" required />
          <button type="submit" [disabled]="loading">{{ loading ? '...' : 'Register' }}</button>
          <p class="error" *ngIf="error">{{ error }}</p>
          <p class="muted">Already have an account? <a routerLink="/front/login">Login</a></p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .auth-card {
      width: min(460px, 100%);
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
    }
    .auth-form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.65rem 0.75rem; }
    button { border: none; border-radius: 8px; padding: 0.7rem; background: #10b981; color: #fff; cursor: pointer; }
    .error { color: #dc2626; margin: 0; font-size: 0.9rem; }
    .muted { color: #6b7280; margin: 0; font-size: 0.9rem; }
    a { color: #2563eb; }
  `]
})
export class RegisterRedirectComponent {
  username = '';
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  loading = false;
  error = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  submit(): void {
    this.error = '';
    this.loading = true;
    this.authService.register({
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim()
    }).subscribe({
      next: (user) => {
        this.loading = false;
        this.router.navigateByUrl(user.role === 'ADMIN' ? '/back/admin-messages' : '/front');
      },
      error: (err) => {
        this.loading = false;
        this.error = authHttpErrorMessage(err, 'Registration failed');
      }
    });
  }
}
