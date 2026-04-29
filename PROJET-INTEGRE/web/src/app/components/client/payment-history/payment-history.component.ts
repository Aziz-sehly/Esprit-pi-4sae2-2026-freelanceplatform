import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { PaymentResponse, PaymentStatus } from '../../../models/payment.model';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
})
export class PaymentHistoryComponent implements OnChanges {
  @Input() contractId: number | null = null;
  @Input() refreshKey = 0;
  @Input() blockActions = false;
  @Input() blockReason = 'Payment actions are blocked while a dispute is active.';
  @Input() readonly = false;
  @Input() title = 'Funding, release and refund flow';
  @Input() eyebrow = 'Payment control center';
  @Input() showMilestoneFilter = true;
  @Output() changed = new EventEmitter<void>();

  milestoneId: number | null = null;
  loading = false;
  errorMsg = '';
  payments: PaymentResponse[] = [];
  searchTerm = '';
  statusFilter: 'ALL' | PaymentStatus = 'ALL';
  sortOption: 'latest' | 'oldest' | 'amountDesc' | 'amountAsc' | 'status' = 'latest';
  pageIndex = 0;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  constructor(private readonly paymentService: PaymentService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['contractId'] || changes['refreshKey']) && this.contractId) {
      this.load();
    }
  }

  load(): void {
    if (!this.contractId) {
      this.payments = [];
      return;
    }

    this.errorMsg = '';
    this.loading = true;
    const request$ = this.milestoneId
      ? this.paymentService.listByMilestoneId(this.milestoneId)
      : this.paymentService.listByContractId(this.contractId);

    request$.subscribe({
      next: (payments) => {
        this.loading = false;
        this.payments = payments ?? [];
        this.pageIndex = 0;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Payment history could not be loaded.';
      },
    });
  }

  release(payment: PaymentResponse): void {
    if (this.readonly) {
      return;
    }

    if (this.blockActions) {
      this.errorMsg = this.blockReason;
      return;
    }

    this.loading = true;
    this.paymentService.release(payment.id).subscribe({
      next: () => {
        this.loading = false;
        this.changed.emit();
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Release failed.';
      },
    });
  }

  refund(payment: PaymentResponse): void {
    if (this.readonly) {
      return;
    }

    if (this.blockActions) {
      this.errorMsg = this.blockReason;
      return;
    }

    const reason = window.prompt('Reason for refund request', 'Client requested refund');
    if (!reason) {
      return;
    }

    this.loading = true;
    this.paymentService.requestRefund(payment.id, { reason }).subscribe({
      next: () => {
        this.loading = false;
        this.changed.emit();
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Refund request failed.';
      },
    });
  }

  chipColor(status: PaymentStatus): 'primary' | 'accent' | 'warn' | undefined {
    if (status === 'FUNDED' || status === 'CHECKOUT_CREATED') {
      return 'accent';
    }
    if (status === 'RELEASED') {
      return 'primary';
    }
    if (status === 'FAILED' || status === 'REFUND_PENDING' || status === 'REFUNDED') {
      return 'warn';
    }
    return undefined;
  }

  statusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'CHECKOUT_CREATED':
        return 'Checkout ready';
      case 'FUNDED':
        return 'Secured';
      case 'RELEASED':
        return 'Paid out';
      case 'REFUND_PENDING':
        return 'Refund requested';
      case 'REFUNDED':
        return 'Refunded';
      case 'FAILED':
        return 'Payment failed';
      case 'INITIATED':
        return 'Started';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  }

  get totalFunded(): number {
    return this.payments
      .filter((payment) => payment.status === 'FUNDED' || payment.status === 'RELEASED')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  get totalReleased(): number {
    return this.payments
      .filter((payment) => payment.status === 'RELEASED')
      .reduce((sum, payment) => sum + payment.netAmount, 0);
  }

  get filteredPayments(): PaymentResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.payments.filter((payment) => {
      const matchesStatus = this.statusFilter === 'ALL' || payment.status === this.statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        `milestone ${payment.milestoneId ?? ''}`,
        this.statusLabel(payment.status),
        payment.provider === 'STRIPE' ? 'online card payment' : payment.provider,
        payment.amount.toString(),
        payment.netAmount.toString(),
        payment.createdAt,
      ].join(' ').toLowerCase().includes(term);
    });

    return filtered.sort((left, right) => this.comparePayments(left, right));
  }

  get pagedPayments(): PaymentResponse[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredPayments.slice(start, start + this.pageSize);
  }

  onFilterChange(): void {
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private comparePayments(left: PaymentResponse, right: PaymentResponse): number {
    switch (this.sortOption) {
      case 'oldest':
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case 'amountAsc':
        return left.amount - right.amount;
      case 'amountDesc':
        return right.amount - left.amount;
      case 'status':
        return this.statusLabel(left.status).localeCompare(this.statusLabel(right.status));
      case 'latest':
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  }
}
