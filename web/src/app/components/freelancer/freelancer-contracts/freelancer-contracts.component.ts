import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/models';

@Component({
  selector: 'app-freelancer-contracts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <p class="eyebrow">Freelancer contracts</p>
        <h1>Contract inbox</h1>
      </header>

      <div *ngIf="banner" class="banner" [class.error]="bannerTone === 'error'">{{ banner }}</div>
      <div class="state-card">
        Router test page loaded successfully.
      </div>
    </section>
  `,
  styles: [`
    .page-shell {
      padding: 2rem;
      display: grid;
      gap: 1rem;
    }

    .page-header {
      padding: 1.5rem;
      border-radius: 24px;
      background: #fff;
      box-shadow: 0 12px 30px rgba(15, 23, 54, 0.08);
    }

    .eyebrow {
      margin: 0 0 0.25rem;
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748b;
    }

    h1, .contract-title {
      margin: 0;
      color: #0f172a;
    }

    .banner,
    .state-card,
    .contract-card {
      padding: 1rem 1.25rem;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 12px 30px rgba(15, 23, 54, 0.08);
    }

    .banner.error {
      color: #991b1b;
      background: #fef2f2;
    }

  `],
})
export class FreelancerContractsComponent {
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  private currentUser: User | null = null;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || this.currentUser.userType !== 'freelancer') {
      this.showBanner('You must be logged in as a freelancer to view contracts.', 'error');
    } else {
      this.showBanner(`Authenticated as freelancer #${this.currentUser.id}`, 'success');
    }
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }
}
