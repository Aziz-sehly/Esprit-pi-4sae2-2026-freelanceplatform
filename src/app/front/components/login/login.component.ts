import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, UserResponse, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <a routerLink="/front" class="logo">Prolance</a>
          <nav class="main-nav">
            <a routerLink="/front/profile-client" routerLinkActive="active">Client Profile</a>
            <a routerLink="/front/profile-freelancer" routerLinkActive="active">Freelancer Profile</a>
          </nav>
          <h1>Welcome Back</h1>
          <p>Sign in to continue on Prolance</p>
        </div>

        <!-- Error / Info Messages -->
        <div class="alert alert-error" *ngIf="errorMessage">
          <span class="alert-icon">⚠️</span>
          {{ errorMessage }}
        </div>
        <div class="alert alert-success" *ngIf="successMessage">
          <span class="alert-icon">✅</span>
          {{ successMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your@email.com"
              required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter your password"
                required>
              <button type="button" class="eye-btn" (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
              <span>Remember me</span>
            </label>
            <a href="#" class="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" class="submit-btn" [disabled]="loading">
            <span class="btn-spinner" *ngIf="loading"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="divider"><span>OR</span></div>

          <button type="button" class="google-btn">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <p class="signup-link">
            Don't have an account? <a routerLink="/front/register">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 2rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 0, 110, 0.1) 0%, transparent 50%);
      }
    }

    .login-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 24px 64px rgba(10, 14, 39, 0.2);
      position: relative;
      z-index: 1;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #0a0e27;
      margin-bottom: 0.5rem;
    }

    .login-header p {
      font-family: 'DM Sans', sans-serif;
      color: #6b7280;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      color: #0a0e27;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #00d9ff;
      box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1);
    }

    .form-group input::placeholder {
      color: #9ca3af;
    }

    .input-wrapper {
      position: relative;
    }

    .input-wrapper input {
      padding-right: 3rem;
    }

    .eye-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0;
      line-height: 1;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #6b7280;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .forgot-link {
      color: #00d9ff;
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 217, 255, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 2rem 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 1rem;
      color: #9ca3af;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .google-btn {
      width: 100%;
      padding: 1rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .google-btn:hover {
      background: #f8f9fb;
      border-color: #d1d5db;
    }

    .signup-link {
      text-align: center;
      margin-top: 2rem;
      font-family: 'DM Sans', sans-serif;
      color: #6b7280;
    }

    .signup-link a {
      color: #00d9ff;
      text-decoration: none;
      font-weight: 600;
    }

    .signup-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        const user: UserResponse = response.user;

        // Check if there's a redirect URL (e.g. from signing email link)
        const redirectUrl = this.route.snapshot.queryParams['redirect'];
        if (redirectUrl) {
          this.router.navigateByUrl(redirectUrl);
          return;
        }

        // Default redirect based on role
        if (user.role === 'FREELANCER') {
          this.router.navigate(['/front/profile-freelancer']);
        } else if (user.role === 'CLIENT') {
          this.router.navigate(['/front/profile-client']);
        } else {
          this.router.navigate(['/front']);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403 || err.status === 401) {
          const msg = err.error?.message || err.error || '';
          if (typeof msg === 'string' && msg.toLowerCase().includes('verify')) {
            this.errorMessage = 'Please verify your email before logging in. Check your inbox.';
          } else if (typeof msg === 'string' && msg.toLowerCase().includes('disabled')) {
            this.errorMessage = 'Your account has been disabled. Please contact support.';
          } else {
            this.errorMessage = 'Invalid email or password.';
          }
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot reach the server. Please try again later.';
        } else {
          this.errorMessage = err.error?.message || err.error || 'Login failed. Please try again.';
        }
      }
    });
  }
}