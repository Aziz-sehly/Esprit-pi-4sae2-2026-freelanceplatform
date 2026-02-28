import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MilestoneResponse, MilestoneStatus} from "../../../models/milestone.model";
import {MilestoneService} from "../../../services/milestone.service";
import {CommonModule} from "@angular/common";
import {PaymentClientComponent} from "../payment-client/payment-client.component";
import { PaymentResponse } from "../../../models/payment.model";
import {PaymentHistoryComponent} from "../payment-history/payment-history.component";
import {RouterLink} from "@angular/router";


@Component({
  selector: 'app-milestone-client',
  templateUrl: './milestone-client.component.html',
  standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, PaymentClientComponent, PaymentHistoryComponent, RouterLink],
  styleUrls: ['./milestone-client.component.scss']
})
export class MilestoneClientComponent implements OnInit {
  loading = false;
  errorMsg = '';
  successMsg = '';
  payModalOpen = false;
  payContractId = 0;
  payMilestoneId = 0;
  payAmount = 0;

// for now (until auth integration)
  payPayerId: number | null = null;
  payPayeeId: number | null = null;

  contractId: number | null = null;
  milestones: MilestoneResponse[] = [];
  minDate: string = '';

  editingId: number | null = null;

  statusFilter: 'ALL' | MilestoneStatus = 'ALL';

  form = this.fb.group({
    contractId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    deliverable: ['', [Validators.required, Validators.maxLength(2000)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDate: [null as string | null, [this.minDateValidator()]],  });

  constructor(private fb: FormBuilder, private ms: MilestoneService) {}

  ngOnInit(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    this.minDate = `${yyyy}-${mm}-${dd}`;
  }
  minDateValidator() {
    return (control: any) => {
      if (!control.value) return null;

      const selected = new Date(control.value);
      const today = new Date();
      today.setHours(0,0,0,0);

      return selected < today ? { pastDate: true } : null;
    };
  }
  load(): void {
    this.clearMsgs();

    if (!this.contractId) {
      this.errorMsg = 'Please enter contractId.';
      return;
    }

    this.loading = true;
    this.ms.listByContractId(this.contractId).subscribe({
      next: (data) => {
        this.milestones = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Failed to load milestones.';
      }
    });
  }
  get f() { return this.form.controls; }

  isInvalid(name: keyof typeof this.form.controls) {
    const c = this.form.get(name as string);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
  openPay(m: MilestoneResponse): void {
    this.payContractId = m.contractId;
    this.payMilestoneId = m.id;
    this.payAmount = m.amount;

    // later: fill these from auth/contract data
    this.payPayerId = null;
    this.payPayeeId = null;

    this.payModalOpen = true;
  }

  onPaid(_payment: PaymentResponse): void {
    // payment-service will call milestone-service markPaid via Feign,
    // so just refresh milestones.
    this.successMsg = 'Payment done. Milestone will be marked as PAID.';
    this.load();
  }
  get filteredMilestones(): MilestoneResponse[] {
    if (this.statusFilter === 'ALL') return this.milestones;
    return this.milestones.filter(m => m.status === this.statusFilter);
  }

  startCreate(): void {
    this.clearMsgs();
    this.editingId = null;

    this.form.reset({
      contractId: this.contractId,
      title: '',
      deliverable: '',
      amount: null,
      dueDate: null
    });
  }

  startEdit(m: MilestoneResponse): void {
    this.clearMsgs();
    this.editingId = m.id;

    this.form.patchValue({
      contractId: m.contractId,
      title: m.title,
      deliverable: m.deliverable,
      amount: m.amount,
      dueDate: m.dueDate
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      contractId: this.contractId,
      title: '',
      deliverable: '',
      amount: null,
      dueDate: null
    });
  }

  save(): void {
    this.clearMsgs();

    if (this.form.invalid) {
      this.errorMsg = 'Please fill required fields correctly.';
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as any;

    this.loading = true;
    const obs = this.editingId
        ? this.ms.update(this.editingId, payload)
        : this.ms.create(payload);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = this.editingId ? 'Milestone updated.' : 'Milestone created.';
        this.editingId = null;
        this.load();
        this.cancelEdit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Save failed.';
      }
    });
  }

  approve(m: MilestoneResponse): void {
    this.clearMsgs();
    this.loading = true;

    this.ms.approve(m.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Milestone approved.';
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Approve failed.';
      }
    });
  }

  markPaid(m: MilestoneResponse): void {
    this.clearMsgs();
    this.loading = true;

    this.ms.markPaid(m.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Milestone marked as PAID.';
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Mark paid failed.';
      }
    });
  }

  remove(m: MilestoneResponse): void {
    this.clearMsgs();
    if (!confirm(`Delete milestone #${m.id}?`)) return;

    this.loading = true;
    this.ms.delete(m.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Milestone deleted.';
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Delete failed.';
      }
    });
  }

  badgeClass(status: MilestoneStatus): string {
    return {
      PENDING: 'badge badge-pending',
      SUBMITTED: 'badge badge-submitted',
      APPROVED: 'badge badge-approved',
      PAID: 'badge badge-paid'
    }[status];
  }

  private clearMsgs(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}