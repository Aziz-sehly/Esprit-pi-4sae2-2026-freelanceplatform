import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilestoneRequest, MilestoneResponse, MilestoneStatus } from '../../models/milestone.model';
import { MilestoneService } from '../../services/milestone.service';
import { CommonModule } from '@angular/common';
import { PaymentClientComponent } from '../payment-client/payment-client.component';
import { PaymentResponse } from '../../models/payment.model';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { RouterLink } from '@angular/router';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { ProjectService } from '../../services/project.service';
import { ProjectProposal } from '../../models/models';

@Component({
  selector: 'app-milestone-client',
  templateUrl: './milestone-client.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaymentClientComponent,
    PaymentHistoryComponent,
    RouterLink,
  ],
  styleUrls: ['./milestone-client.component.scss'],
})
export class MilestoneClientComponent implements OnInit {
  loading = false;
  contractsLoading = false;
  errorMsg = '';
  successMsg = '';
  payModalOpen = false;
  payContractId = 0;
  payMilestoneId = 0;
  payAmount = 0;

  payPayerId: number | null = null;
  payPayeeId: number | null = null;

  /** Contracts = accepted proposals (proposal ID = contract ID) */
  contracts: ProjectProposal[] = [];
  projectTitles: Record<number, string> = {};
  contractId: number | null = null;
  milestones: MilestoneResponse[] = [];
  minDate = '';

  editingId: number | null = null;

  statusFilter: 'ALL' | MilestoneStatus = 'ALL';

  private readonly clientId = 1;

  form = this.fb.group({
    contractId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    deliverable: ['', [Validators.required, Validators.maxLength(2000)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDate: [null as string | null, [this.minDateValidator()]],
  });

  constructor(
    private fb: FormBuilder,
    private ms: MilestoneService,
    private proposalService: ProjectProposalService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;
    this.loadContracts();
  }

  loadContracts(): void {
    this.contractsLoading = true;
    this.proposalService.getAcceptedContractsForClient(this.clientId).subscribe({
      next: (list) => {
        this.contracts = list;
        this.contractsLoading = false;
        const projectIds = [...new Set(list.map((p) => p.projectId))];
        projectIds.forEach((id) => {
          this.projectService.getById(id).subscribe((proj) => {
            if (proj) this.projectTitles[id] = proj.title;
          });
        });
      },
      error: () => {
        this.contractsLoading = false;
      },
    });
  }

  getContractLabel(p: ProjectProposal): string {
    const title = this.projectTitles[p.projectId] || `Project #${p.projectId}`;
    return `Proposal #${p.id} – ${title} (Freelancer #${p.freelancerId})`;
  }

  minDateValidator() {
    return (control: { value: string }) => {
      if (!control.value) return null;
      const selected = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected < today ? { pastDate: true } : null;
    };
  }

  load(): void {
    this.clearMsgs();

    if (!this.contractId) {
      this.errorMsg = 'Please select a contract.';
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
      },
    });
  }

  get f() {
    return this.form.controls;
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  openPay(m: MilestoneResponse): void {
    this.payContractId = m.contractId;
    this.payMilestoneId = m.id;
    this.payAmount = m.amount;
    const proposal = this.contracts.find((c) => c.id === m.contractId);
    this.payPayerId = proposal ? this.clientId : null;
    this.payPayeeId = proposal ? proposal.freelancerId : null;
    this.payModalOpen = true;
  }

  onPaid(_payment: PaymentResponse): void {
    this.successMsg = 'Payment done. Milestone will be marked as PAID.';
    this.load();
  }

  get filteredMilestones(): MilestoneResponse[] {
    if (this.statusFilter === 'ALL') return this.milestones;
    return this.milestones.filter((m) => m.status === this.statusFilter);
  }

  startCreate(): void {
    this.clearMsgs();
    this.editingId = null;
    this.form.reset({
      contractId: this.contractId,
      title: '',
      deliverable: '',
      amount: null,
      dueDate: null,
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
      dueDate: m.dueDate,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      contractId: this.contractId,
      title: '',
      deliverable: '',
      amount: null,
      dueDate: null,
    });
  }

  save(): void {
    this.clearMsgs();

    if (this.form.invalid) {
      this.errorMsg = 'Please fill required fields correctly.';
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: MilestoneRequest = {
      contractId: raw.contractId!,
      title: raw.title!,
      deliverable: raw.deliverable!,
      amount: raw.amount!,
      dueDate: raw.dueDate,
    };

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
      },
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
      },
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
      },
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
      },
    });
  }

  badgeClass(status: MilestoneStatus): string {
    return {
      PENDING: 'badge badge-pending',
      SUBMITTED: 'badge badge-submitted',
      APPROVED: 'badge badge-approved',
      PAID: 'badge badge-paid',
    }[status];
  }

  private clearMsgs(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
