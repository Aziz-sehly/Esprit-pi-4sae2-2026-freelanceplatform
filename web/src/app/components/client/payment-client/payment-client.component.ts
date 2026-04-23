import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CheckoutSessionResponse, PaymentMethod, PaymentRequest } from '../../../models/payment.model';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-payment-client',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './payment-client.component.html',
  styleUrls: ['./payment-client.component.scss'],
})
export class PaymentClientComponent {
  @Input() open = false;
  @Input() contractId!: number;
  @Input() milestoneId!: number;
  @Input() amount!: number;
  @Input() payerId: number | null = null;
  @Input() payeeId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() checkoutCreated = new EventEmitter<CheckoutSessionResponse>();

  loading = false;
  errorMsg = '';
  helperMsg = '';
  readonly methods: PaymentMethod[] = ['CARD'];

  readonly form = this.fb.nonNullable.group({
    method: ['CARD' as PaymentMethod, [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly paymentService: PaymentService
  ) {}

  ngOnChanges(): void {
    if (this.open) {
      this.errorMsg = '';
      this.helperMsg = '';
      this.form.patchValue({
        method: 'CARD',
      });
    }
  }

  close(): void {
    this.open = false;
    this.closed.emit();
  }

  confirmPay(): void {
    this.errorMsg = '';
    this.helperMsg = '';

    if (this.form.invalid || !this.payerId || !this.payeeId) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Payment details are incomplete. Reload the contract and try again.';
      return;
    }

    const payload: PaymentRequest = {
      contractId: this.contractId,
      milestoneId: this.milestoneId,
      payerId: this.payerId,
      payeeId: this.payeeId,
      amount: this.amount,
      method: this.form.controls.method.value,
    };

    this.loading = true;
    this.paymentService.createCheckoutSession(payload).subscribe({
      next: (session) => {
        this.loading = false;
        this.checkoutCreated.emit(session);

        if (session.checkoutUrl) {
          window.location.assign(session.checkoutUrl);
          return;
        }

        this.helperMsg = 'Payment session created successfully.';
        this.close();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Payment checkout could not be created.';
      },
    });
  }

  get platformFee(): number {
    return this.amount ? this.amount * 0.05 : 0;
  }
}
