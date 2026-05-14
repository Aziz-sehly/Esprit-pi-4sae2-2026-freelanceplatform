import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// ── Skill chips available for freelancers ──────────────────────────────────────
const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js',
  'Node.js', 'Spring Boot', 'Python', 'Java', 'PHP',
  'UI/UX Design', 'Figma', 'Graphic Design', 'Illustration',
  'Content Writing', 'SEO', 'Video Editing', 'Motion Graphics',
  'DevOps', 'AWS', 'Docker', 'Machine Learning', 'Data Analysis'
];

// ── Industry options for clients ──────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  'Technology', 'Healthcare', 'Finance', 'Education',
  'E-commerce', 'Marketing', 'Media & Entertainment',
  'Real Estate', 'Consulting', 'Other'
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card" [class.wide]="step > 1">

        <!-- ── Progress Bar ───────────────────────────────────────────── -->
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="(step / totalSteps) * 100"></div>
        </div>

        <!-- ── Step Indicator ────────────────────────────────────────── -->
        <div class="step-indicator">
          <div class="step-dot" *ngFor="let s of stepsArray; let i = index"
               [class.active]="step === i + 1"
               [class.done]="step > i + 1">
            <span *ngIf="step <= i + 1">{{ i + 1 }}</span>
            <span *ngIf="step > i + 1">✓</span>
          </div>
        </div>

        <!-- ── Alerts ─────────────────────────────────────────────────── -->
        <div class="alert alert-error" *ngIf="errorMessage">
          <span>⚠️</span> {{ errorMessage }}
        </div>
        <div class="alert alert-success" *ngIf="successMessage">
          <span>✅</span> {{ successMessage }}
        </div>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- STEP 1 — Account Type + Basic Info                          -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <div *ngIf="step === 1" class="step-content">
          <div class="step-header">
            <h1>Join Prolance</h1>
            <p>Create your account and start working</p>
          </div>

          <div class="user-type-selector">
            <button type="button"
                    [class.active]="userType === 'FREELANCER'"
                    (click)="userType = 'FREELANCER'">
              <span class="type-icon">🎯</span>
              <span class="type-label">Freelancer</span>
              <span class="type-desc">I offer services</span>
            </button>
            <button type="button"
                    [class.active]="userType === 'CLIENT'"
                    (click)="userType = 'CLIENT'">
              <span class="type-icon">💼</span>
              <span class="type-label">Client</span>
              <span class="type-desc">I hire talent</span>
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName"
                     placeholder="John" required>
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName"
                     placeholder="Doe" required>
            </div>
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email"
                   placeholder="your@email.com" required>
          </div>

          <div class="form-group">
            <label>Password</label>
            <div class="input-wrapper">
              <input [type]="showPassword ? 'text' : 'password'"
                     [(ngModel)]="password" name="password"
                     placeholder="Min. 8 characters" required>
              <button type="button" class="eye-btn"
                      (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="password-strength" *ngIf="password.length > 0">
              <div class="strength-bar">
                <div class="strength-fill"
                     [style.width.%]="passwordStrength"
                     [class]="strengthClass"></div>
              </div>
              <span class="strength-label" [class]="strengthClass">
                {{ strengthLabel }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>Phone Number <span class="optional">(optional)</span></label>
            <input type="tel" [(ngModel)]="phoneNumber" name="phoneNumber"
                   placeholder="+216 XX XXX XXX">
          </div>

          <button class="submit-btn" (click)="nextStep()" [disabled]="!canProceedStep1()">
            Continue
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <p class="login-link">
            Already have an account? <a routerLink="/front/login">Log in</a>
          </p>
        </div>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- STEP 2 — Freelancer Profile                                 -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <div *ngIf="step === 2 && userType === 'FREELANCER'" class="step-content">
          <div class="step-header">
            <h1>Your Freelancer Profile</h1>
            <p>Help clients discover you and your expertise</p>
          </div>

          <div class="form-group">
            <label>Professional Title</label>
            <input type="text" [(ngModel)]="professionalTitle" name="title"
                   placeholder="e.g. Full Stack Developer, UI/UX Designer">
          </div>

          <div class="form-group">
            <label>Bio <span class="optional">(tell clients about yourself)</span></label>
            <textarea [(ngModel)]="bio" name="bio" rows="4"
                      placeholder="Describe your experience, strengths, and what makes you unique..."
                      maxlength="500"></textarea>
            <span class="char-count">{{ bio.length }}/500</span>
          </div>

          <div class="form-group">
            <label>Skills</label>
            <div class="skills-grid">
              <button type="button"
                      *ngFor="let skill of skillOptions"
                      class="skill-chip"
                      [class.selected]="selectedSkills.includes(skill)"
                      (click)="toggleSkill(skill)">
                {{ skill }}
              </button>
            </div>
            <input type="text" [(ngModel)]="customSkill" name="customSkill"
                   placeholder="+ Add custom skill and press Enter"
                   (keydown.enter)="addCustomSkill(); $event.preventDefault()">
          </div>

          <div class="form-group">
            <label>Portfolio URL <span class="optional">(optional)</span></label>
            <div class="input-with-icon">
              <span class="input-icon">🔗</span>
              <input type="url" [(ngModel)]="portfolioUrl" name="portfolioUrl"
                     placeholder="https://your-portfolio.com">
            </div>
          </div>

          <div class="form-group">
            <label>Work Experience</label>
            <div class="experience-options">
              <button type="button"
                      *ngFor="let exp of experienceOptions"
                      class="exp-chip"
                      [class.selected]="workExperience === exp.value"
                      (click)="workExperience = exp.value">
                <span class="exp-icon">{{ exp.icon }}</span>
                <span class="exp-label">{{ exp.label }}</span>
                <span class="exp-desc">{{ exp.desc }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Hourly Rate (USD)</label>
            <div class="input-with-icon">
              <span class="input-icon">$</span>
              <input type="number" [(ngModel)]="hourlyRate" name="hourlyRate"
                     placeholder="e.g. 25" min="1">
              <span class="input-suffix">/hr</span>
            </div>
          </div>

          <div class="btn-row">
            <button class="back-btn" (click)="prevStep()">← Back</button>
            <button class="submit-btn" (click)="submitRegister()" [disabled]="loading">
              <span class="btn-spinner" *ngIf="loading"></span>
              {{ loading ? 'Creating account...' : 'Create Account 🚀' }}
            </button>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- STEP 2 — Client Profile                                     -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <div *ngIf="step === 2 && userType === 'CLIENT'" class="step-content">
          <div class="step-header">
            <h1>Your Client Profile</h1>
            <p>Help freelancers understand your business</p>
          </div>

          <div class="form-group">
            <label>Company Name <span class="optional">(optional)</span></label>
            <div class="input-with-icon">
              <span class="input-icon">🏢</span>
              <input type="text" [(ngModel)]="companyName" name="companyName"
                     placeholder="Your company or organization name">
            </div>
          </div>

          <div class="form-group">
            <label>Industry</label>
            <div class="skills-grid">
              <button type="button"
                      *ngFor="let ind of industryOptions"
                      class="skill-chip"
                      [class.selected]="selectedIndustry === ind"
                      (click)="selectedIndustry = ind">
                {{ ind }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>About Your Projects <span class="optional">(optional)</span></label>
            <textarea [(ngModel)]="bio" name="bio" rows="4"
                      placeholder="What kind of projects do you usually hire for? What are your goals?"
                      maxlength="500"></textarea>
            <span class="char-count">{{ bio.length }}/500</span>
          </div>

          <div class="form-group">
            <label>Typical Project Budget</label>
            <div class="budget-options">
              <button type="button"
                      *ngFor="let b of budgetOptions"
                      class="budget-chip"
                      [class.selected]="selectedBudget === b.value"
                      (click)="selectedBudget = b.value">
                {{ b.label }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Website / LinkedIn <span class="optional">(optional)</span></label>
            <div class="input-with-icon">
              <span class="input-icon">🔗</span>
              <input type="url" [(ngModel)]="portfolioUrl" name="websiteUrl"
                     placeholder="https://yourcompany.com">
            </div>
          </div>

          <div class="btn-row">
            <button class="back-btn" (click)="prevStep()">← Back</button>
            <button class="submit-btn" (click)="submitRegister()" [disabled]="loading">
              <span class="btn-spinner" *ngIf="loading"></span>
              {{ loading ? 'Creating account...' : 'Create Account 🚀' }}
            </button>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- STEP 3 — Success / Email Verification                       -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <div *ngIf="step === 3" class="step-content success-step">
          <div class="success-icon">📬</div>
          <h1>Check your inbox!</h1>
          <p class="success-desc">
            We sent a verification link to <strong>{{ email }}</strong>.
            Click the link to activate your account and start using Prolance.
          </p>
          <div class="success-tips">
            <div class="tip">💡 Check your spam folder if you don't see it</div>
            <div class="tip">⏳ The link expires in 24 hours</div>
          </div>
          <a routerLink="/front/login" class="submit-btn" style="text-decoration:none; display:flex; justify-content:center;">
            Go to Login →
          </a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

    :host { display: block; }

    .register-container {
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
          radial-gradient(circle at 20% 50%, rgba(0,217,255,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,0,110,0.08) 0%, transparent 50%);
      }
    }

    .register-card {
      background: white;
      border-radius: 24px;
      padding: 0;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 24px 64px rgba(10,14,39,0.25);
      position: relative;
      z-index: 1;
      overflow: hidden;
      transition: max-width 0.4s ease;
      &.wide { max-width: 620px; }
    }

    .progress-bar {
      height: 4px;
      background: #f0f0f0;
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d9ff, #0099ff);
        transition: width 0.5s ease;
      }
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem 0 0;
      .step-dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        color: #9ca3af;
        transition: all 0.3s;
        &.active {
          border-color: #00d9ff;
          background: #00d9ff;
          color: white;
        }
        &.done {
          border-color: #10b981;
          background: #10b981;
          color: white;
        }
      }
    }

    .step-content {
      padding: 2rem 3rem 3rem;
    }

    .step-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 {
        font-family: 'Syne', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: #0a0e27;
        margin-bottom: 0.4rem;
      }
      p { font-family: 'DM Sans', sans-serif; color: #6b7280; }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin: 0 3rem 1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    /* ── Type Selector ──────────────────────────────────────────── */
    .user-type-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
      button {
        padding: 1.25rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
        transition: all 0.25s;
        .type-icon { font-size: 2rem; }
        .type-label {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #0a0e27;
          font-size: 1rem;
        }
        .type-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        &.active {
          background: linear-gradient(135deg, #e0f9ff 0%, #dbeeff 100%);
          border-color: #00d9ff;
          .type-label { color: #0099ff; }
        }
        &:hover:not(.active) { border-color: #d1d5db; background: #f9fafb; }
      }
    }

    /* ── Form Groups ────────────────────────────────────────────── */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
      label {
        display: block;
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
      }
      .optional { font-weight: 400; color: #9ca3af; font-size: 0.8rem; }
      input, textarea {
        width: 100%;
        padding: 0.8rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-sizing: border-box;
        resize: vertical;
        &:focus {
          outline: none;
          border-color: #00d9ff;
          box-shadow: 0 0 0 3px rgba(0,217,255,0.1);
        }
        &::placeholder { color: #9ca3af; }
      }
    }
    .char-count {
      display: block;
      text-align: right;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
      font-family: 'DM Sans', sans-serif;
    }

    .input-wrapper {
      position: relative;
      input { padding-right: 3rem; }
    }
    .eye-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
    }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
      .input-icon {
        position: absolute;
        left: 0.9rem;
        font-size: 1rem;
        pointer-events: none;
      }
      .input-suffix {
        position: absolute;
        right: 1rem;
        font-family: 'DM Sans', sans-serif;
        color: #6b7280;
        font-size: 0.9rem;
        pointer-events: none;
      }
      input { padding-left: 2.5rem; }
    }

    /* ── Password Strength ──────────────────────────────────────── */
    .password-strength {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .strength-bar {
      flex: 1;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }
    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease, background 0.3s ease;
      &.weak { background: #ef4444; }
      &.fair { background: #f59e0b; }
      &.good { background: #10b981; }
      &.strong { background: #059669; }
    }
    .strength-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      &.weak { color: #ef4444; }
      &.fair { color: #f59e0b; }
      &.good { color: #10b981; }
      &.strong { color: #059669; }
    }

    /* ── Skills Grid ────────────────────────────────────────────── */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .skill-chip {
      padding: 0.4rem 0.9rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 999px;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: #374151;
      &.selected {
        background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
        border-color: #00d9ff;
        color: white;
      }
      &:hover:not(.selected) { border-color: #00d9ff; color: #0099ff; }
    }

    /* ── Experience Options ─────────────────────────────────────── */
    .experience-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .exp-chip {
      padding: 0.875rem 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
      .exp-icon { font-size: 1.5rem; }
      .exp-label {
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
        font-size: 0.85rem;
        color: #0a0e27;
      }
      .exp-desc {
        font-family: 'DM Sans', sans-serif;
        font-size: 0.72rem;
        color: #9ca3af;
        text-align: center;
      }
      &.selected { border-color: #00d9ff; background: #e0f9ff; }
    }

    /* ── Budget Options ─────────────────────────────────────────── */
    .budget-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .budget-chip {
      padding: 0.5rem 1rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 999px;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: #374151;
      &.selected { background: #e0f9ff; border-color: #00d9ff; color: #0099ff; }
    }

    /* ── Buttons ────────────────────────────────────────────────── */
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
      box-shadow: 0 8px 24px rgba(0,217,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0,217,255,0.4);
      }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-row {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .back-btn {
      padding: 1rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      cursor: pointer;
      color: #6b7280;
      white-space: nowrap;
      transition: all 0.2s;
      &:hover { border-color: #d1d5db; background: #f9fafb; }
    }
    .btn-row .submit-btn { flex: 1; }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      font-family: 'DM Sans', sans-serif;
      color: #6b7280;
      font-size: 0.9rem;
      a { color: #00d9ff; text-decoration: none; font-weight: 600; }
    }

    /* ── Success Step ───────────────────────────────────────────── */
    .success-step {
      text-align: center;
      .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: bounce 1s ease infinite alternate;
      }
      h1 {
        font-family: 'Syne', sans-serif;
        font-size: 1.75rem;
        color: #0a0e27;
        margin-bottom: 1rem;
      }
      .success-desc {
        font-family: 'DM Sans', sans-serif;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 1.5rem;
        strong { color: #0a0e27; }
      }
      .success-tips {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 2rem;
        .tip {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #6b7280;
          padding: 0.4rem 0;
        }
      }
    }
    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
  `]
})
export class RegisterComponent {

  // ── State ────────────────────────────────────────────────────────────────────
  step = 1;
  totalSteps = 3;
  get stepsArray() { return Array.from({ length: this.totalSteps }, (_, i) => i); }

  // Step 1 fields
  userType: 'FREELANCER' | 'CLIENT' = 'FREELANCER';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  phoneNumber = '';
  showPassword = false;

  // Step 2 — freelancer
  professionalTitle = '';
  bio = '';
  selectedSkills: string[] = [];
  customSkill = '';
  portfolioUrl = '';
  workExperience = '';
  hourlyRate: number | null = null;

  // Step 2 — client
  companyName = '';
  selectedIndustry = '';
  selectedBudget = '';

  // UI state
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Options
  skillOptions = SKILL_OPTIONS;
  industryOptions = INDUSTRY_OPTIONS;
  experienceOptions = [
    { value: 'ENTRY', icon: '🌱', label: 'Entry', desc: '0–2 years' },
    { value: 'INTERMEDIATE', icon: '⚡', label: 'Intermediate', desc: '2–5 years' },
    { value: 'EXPERT', icon: '🏆', label: 'Expert', desc: '5+ years' }
  ];
  budgetOptions = [
    { value: 'under500', label: '< $500' },
    { value: '500-2000', label: '$500–2K' },
    { value: '2000-10000', label: '$2K–10K' },
    { value: 'over10000', label: '$10K+' }
  ];

  // ── Password strength ────────────────────────────────────────────────────────
  get passwordStrength(): number {
    const p = this.password;
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9]/.test(p)) score += 25;
    if (/[^A-Za-z0-9]/.test(p)) score += 25;
    return score;
  }
  get strengthClass(): string {
    const s = this.passwordStrength;
    if (s <= 25) return 'weak';
    if (s <= 50) return 'fair';
    if (s <= 75) return 'good';
    return 'strong';
  }
  get strengthLabel(): string {
    return { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' }[this.strengthClass] || '';
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  canProceedStep1(): boolean {
    return !!this.firstName && !!this.lastName && !!this.email && this.password.length >= 8;
  }

  nextStep(): void {
    this.errorMessage = '';
    if (this.step === 1 && !this.canProceedStep1()) {
      this.errorMessage = 'Please fill in all required fields (password must be 8+ characters).';
      return;
    }
    if (this.step < this.totalSteps - 1) this.step++;
  }

  prevStep(): void {
    if (this.step > 1) this.step--;
  }

  // ── Skills ───────────────────────────────────────────────────────────────────
  toggleSkill(skill: string): void {
    const idx = this.selectedSkills.indexOf(skill);
    if (idx === -1) this.selectedSkills.push(skill);
    else this.selectedSkills.splice(idx, 1);
  }

  addCustomSkill(): void {
    const s = this.customSkill.trim();
    if (s && !this.selectedSkills.includes(s)) {
      this.selectedSkills.push(s);
    }
    this.customSkill = '';
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  submitRegister(): void {
    this.loading = true;
    this.errorMessage = '';

    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.userType,
      phoneNumber: this.phoneNumber || undefined,
      skills: this.selectedSkills.join(', ') || undefined,
      portfolioUrl: this.portfolioUrl || undefined,
      companyName: this.companyName || undefined
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.loading = false;
        this.step = 3; // success step
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409 || (err.error && typeof err.error === 'string' && err.error.includes('already in use'))) {
          this.errorMessage = 'This email is already registered. Try logging in instead.';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot reach the server. Please try again later.';
        } else {
          this.errorMessage = err.error?.message || err.error || 'Registration failed. Please try again.';
        }
      }
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
}