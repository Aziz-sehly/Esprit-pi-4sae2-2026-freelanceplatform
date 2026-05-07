import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { PaymentMethod, PaymentRequest, PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  @Output() paid = new EventEmitter<PaymentResponse>();

  loading = false;
  errorMsg = '';
  successMsg = '';

  methods: PaymentMethod[] = ['CARD', 'WALLET', 'BANK_TRANSFER', 'CASH'];

  form = this.fb.group({
    payerId: [null as number | null, [Validators.required, Validators.min(1)]],
    payeeId: [null as number | null, [Validators.required, Validators.min(1)]],
    method: ['CARD' as PaymentMethod, [Validators.required]],
  });

  constructor(private fb: FormBuilder, private paymentService: PaymentService) {}

  ngOnChanges(): void {
    if (this.open) {
      this.errorMsg = '';
      this.successMsg = '';
      this.form.patchValue({
        payerId: this.payerId,
        payeeId: this.payeeId,
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
    this.successMsg = '';

    if (this.form.invalid) {
      this.errorMsg = 'Please fill payerId / payeeId and select a method.';
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: PaymentRequest = {
      contractId: this.contractId,
      milestoneId: this.milestoneId,
      payerId: v.payerId!,
      payeeId: v.payeeId!,
      amount: this.amount,
      method: v.method!,
    };

    this.loading = true;
    this.paymentService.create(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = 'Payment created successfully.';
        this.paid.emit(res);
        this.close();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Payment failed.';
      },
    });
  }
}
