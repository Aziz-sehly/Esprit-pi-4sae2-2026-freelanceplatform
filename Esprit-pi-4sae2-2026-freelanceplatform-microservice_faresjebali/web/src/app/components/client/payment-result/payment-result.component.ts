import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="result-shell">
      <mat-card class="result-card">
        <div class="icon-wrap" [class.cancel]="isCancel">
          <mat-icon>{{ isCancel ? 'close' : 'check_circle' }}</mat-icon>
        </div>
        <p class="eyebrow">{{ isCancel ? 'Payment canceled' : 'Payment submitted' }}</p>
        <h1>{{ isCancel ? 'The payment was canceled.' : 'Your payment is being confirmed.' }}</h1>
        <p class="summary">
          {{
            isCancel
              ? 'No charge was completed. You can return and try again when ready.'
              : 'The milestone will move into the secured state as soon as the payment confirmation is received.'
          }}
        </p>

        <div class="actions">
          <button mat-flat-button color="primary" type="button" (click)="goBack()">Back</button>
        </div>
      </mat-card>
    </section>
  `,
  styles: [`
    .result-shell {
      min-height: calc(100vh - 180px);
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    .result-card {
      width: min(640px, 100%);
      padding: 2rem;
      border-radius: 28px;
      background: linear-gradient(160deg, rgba(255,255,255,0.96), rgba(244,247,255,0.94));
      box-shadow: 0 28px 80px rgba(14, 25, 60, 0.12);
    }

    .icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #0f9d6c, #1ec8a5);
      color: white;
      margin-bottom: 1.25rem;
    }

    .icon-wrap.cancel {
      background: linear-gradient(135deg, #d14f5d, #f28b82);
    }

    .icon-wrap mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.72rem;
      color: #6d7393;
      margin-bottom: 0.75rem;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1.04;
      margin: 0 0 1rem;
      color: #0d1635;
    }

    .summary {
      color: #5f6580;
      font-size: 1rem;
      margin-bottom: 1.5rem;
      max-width: 54ch;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `],
})
export class PaymentResultComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly isCancel = this.route.snapshot.routeConfig?.path === 'payments/cancel';

  goBack(): void {
    this.location.back();
  }
}
