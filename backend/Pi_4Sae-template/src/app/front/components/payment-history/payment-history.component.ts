import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaymentResponse, PaymentStatus } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
})
export class PaymentHistoryComponent implements OnChanges {
  @Input() contractId: number | null = null;

  milestoneId: number | null = null;

  loading = false;
  errorMsg = '';
  successMsg = '';

  payments: PaymentResponse[] = [];

  constructor(private paymentService: PaymentService) {}

  ngOnChanges(): void {
    if (this.contractId) this.load();
    else this.payments = [];
  }

  load(): void {
    this.clearMsgs();

    if (!this.contractId) {
      this.errorMsg = 'Please enter contractId.';
      return;
    }

    this.loading = true;

    const obs = this.milestoneId
      ? this.paymentService.listByMilestoneId(this.milestoneId)
      : this.paymentService.listByContractId(this.contractId);

    obs.subscribe({
      next: (data) => {
        this.loading = false;
        this.payments = data ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Failed to load payments.';
      },
    });
  }

  clearFilter(): void {
    this.milestoneId = null;
    this.load();
  }

  remove(p: PaymentResponse): void {
    this.clearMsgs();
    if (!confirm(`Delete payment #${p.id}?`)) return;

    this.loading = true;
    this.paymentService.delete(p.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Payment deleted.';
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Delete failed.';
      },
    });
  }

  statusClass(s: PaymentStatus): string {
    return {
      PENDING: 'badge badge-pending',
      SUCCESS: 'badge badge-success',
      FAILED: 'badge badge-failed',
      REFUNDED: 'badge badge-refunded',
    }[s];
  }

  private clearMsgs(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
