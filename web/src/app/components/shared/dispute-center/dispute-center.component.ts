import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ContractResponse } from '../../../models/contract.model';
import { DisputeCreateRequest, DisputeReason, DisputeResponse, DisputeStatus } from '../../../models/dispute.model';
import { MilestoneResponse } from '../../../models/milestone.model';
import { DisputeService } from '../../../services/dispute.service';
import { MilestoneService } from '../../../services/milestone.service';
import { MessageSenderRole } from '../../../models/chat.model';

@Component({
  selector: 'app-dispute-center',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dispute-center.component.html',
  styleUrls: ['./dispute-center.component.scss'],
})
export class DisputeCenterComponent implements OnChanges {
  @Input({ required: true }) contract!: ContractResponse;
  @Input({ required: true }) actorId!: number;
  @Input({ required: true }) actorName!: string;
  @Input({ required: true }) actorRole!: MessageSenderRole;
  @Input({ required: true }) accentClass: 'client' | 'freelancer' = 'client';
  @Input() canModerate = false;
  @Input() backLink = '/';
  @Input() backLabel = 'Back';

  loading = false;
  disputes: DisputeResponse[] = [];
  milestones: MilestoneResponse[] = [];
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  actionComposerFor: number | null = null;
  actionMode: 'review' | 'resolve' | 'reject' | null = null;
  readonly reasons: DisputeReason[] = ['QUALITY_ISSUE', 'DELAY', 'PAYMENT_ISSUE', 'COMMUNICATION', 'SCOPE_CHANGE', 'OTHER'];

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(3000)]],
    reason: ['QUALITY_ISSUE' as DisputeReason, [Validators.required]],
    milestoneId: [null as number | null],
    paymentId: [null as number | null],
  });

  readonly actionForm = this.fb.group({
    note: ['', [Validators.required, Validators.maxLength(2400)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly disputeService: DisputeService,
    private readonly milestoneService: MilestoneService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract?.id) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.contract?.id) {
      return;
    }

    this.loading = true;
    this.disputeService.list(this.contract.id).subscribe({
      next: (disputes) => {
        this.disputes = disputes ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Disputes could not be loaded.', 'error');
      },
    });

    this.milestoneService.listByContractId(this.contract.id).subscribe({
      next: (milestones) => {
        this.milestones = milestones ?? [];
      },
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: DisputeCreateRequest = {
      contractId: this.contract.id,
      milestoneId: value.milestoneId,
      paymentId: value.paymentId,
      reason: value.reason!,
      openedByRole: this.actorRole,
      openedById: this.actorId,
      openedByName: this.actorName,
      title: value.title!.trim(),
      description: value.description!.trim(),
    };

    this.loading = true;
    this.disputeService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.form.reset({
          title: '',
          description: '',
          reason: 'QUALITY_ISSUE',
          milestoneId: null,
          paymentId: null,
        });
        this.showBanner('Dispute opened successfully.', 'success');
        this.loadData();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Dispute could not be created.', 'error');
      },
    });
  }

  startAction(dispute: DisputeResponse, mode: 'review' | 'resolve' | 'reject'): void {
    this.actionComposerFor = dispute.id;
    this.actionMode = mode;
    this.actionForm.reset({ note: dispute.resolutionNote || '' });
  }

  cancelAction(): void {
    this.actionComposerFor = null;
    this.actionMode = null;
    this.actionForm.reset({ note: '' });
  }

  submitAction(dispute: DisputeResponse): void {
    if (!this.actionMode || this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    const note = (this.actionForm.controls.note.value ?? '').trim();
    this.loading = true;
    const request$ =
      this.actionMode === 'review'
        ? this.disputeService.review(dispute.id, { note })
        : this.actionMode === 'resolve'
          ? this.disputeService.resolve(dispute.id, { note })
          : this.disputeService.reject(dispute.id, { note });

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.cancelAction();
        this.showBanner(`Dispute ${this.actionMode === 'review' ? 'moved to review' : this.actionMode}.`, 'success');
        this.loadData();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Dispute update failed.', 'error');
      },
    });
  }

  chipColor(status: DisputeStatus): 'primary' | 'accent' | 'warn' | undefined {
    if (status === 'RESOLVED') return 'primary';
    if (status === 'UNDER_REVIEW') return 'accent';
    if (status === 'OPEN' || status === 'REJECTED') return 'warn';
    return undefined;
  }

  reasonLabel(reason: DisputeReason): string {
    return reason.replaceAll('_', ' ');
  }

  get openCount(): number {
    return this.disputes.filter((item) => item.status === 'OPEN').length;
  }

  get reviewCount(): number {
    return this.disputes.filter((item) => item.status === 'UNDER_REVIEW').length;
  }

  get resolvedCount(): number {
    return this.disputes.filter((item) => item.status === 'RESOLVED').length;
  }

  get blockingCount(): number {
    return this.disputes.filter((item) => item.status === 'OPEN' || item.status === 'UNDER_REVIEW').length;
  }

  milestoneTitle(id: number | null): string {
    if (!id) {
      return 'Contract-wide';
    }

    return this.milestones.find((milestone) => milestone.id === id)?.title || `Milestone #${id}`;
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }
}
