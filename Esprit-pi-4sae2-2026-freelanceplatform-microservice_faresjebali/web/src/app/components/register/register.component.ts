import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h1>Join Talently</h1>
        <p>Create your account and start working</p>

        <form (ngSubmit)="onSubmit()" class="register-form">
          <div class="user-type-selector">
            <button type="button" 
                    [class.active]="userType === 'freelancer'"
                    (click)="userType = 'freelancer'">
              🎯 Freelancer
            </button>
            <button type="button" 
                    [class.active]="userType === 'client'"
                    (click)="userType = 'client'">
              💼 Client
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName" required>
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName" required>
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required>
          </div>

          <button type="submit" class="submit-btn">Create Account</button>
          
          <p class="login-link">
            Already have an account? <a routerLink="/login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 2rem;
    }
    .register-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
    }
    h1 { 
      font-family: 'Syne', sans-serif;
      font-size: 2rem; 
      margin-bottom: 0.5rem; 
      color: #0a0e27;
    }
    p {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .user-type-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 2rem 0;
    }
    .user-type-selector button {
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .user-type-selector button.active {
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border-color: #00d9ff;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #0a0e27;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
    }
    input:focus {
      outline: none;
      border-color: #00d9ff;
    }
    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      font-size: 1rem;
      box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
      transition: all 0.3s;
    }
    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 217, 255, 0.4);
    }
    .login-link {
      margin-top: 2rem;
      color: #6b7280;
    }
    .login-link a {
      color: #00d9ff;
      text-decoration: none;
      font-weight: 600;
    }
    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  userType: 'freelancer' | 'client' = 'freelancer';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.authService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      userType: this.userType
    }).subscribe(() => {
      this.router.navigate(['/jobs']);
    });
  }
}
