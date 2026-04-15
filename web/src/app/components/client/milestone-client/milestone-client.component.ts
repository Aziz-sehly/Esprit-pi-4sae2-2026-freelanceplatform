import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ContractResponse } from '../../../models/contract.model';
import { MilestoneResponse, MilestoneStatus } from '../../../models/milestone.model';
import { AppNotification } from '../../../models/notification.model';
import { CheckoutSessionResponse } from '../../../models/payment.model';
import { ContractService } from '../../../services/contract.service';
import { DisputeService } from '../../../services/dispute.service';
import { MilestoneService } from '../../../services/milestone.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { ContractChatComponent } from '../../shared/contract-chat/contract-chat.component';
import { ContractCallComponent } from '../../shared/contract-call/contract-call.component';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';
import { PaymentClientComponent } from '../payment-client/payment-client.component';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { User } from '../../../models/models';

@Component({
  selector: 'app-milestone-client',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    ContractChatComponent,
    ContractCallComponent,
    ResourcesPanelComponent,
    PaymentClientComponent,
    PaymentHistoryComponent,
  ],
  templateUrl: './milestone-client.component.html',
  styleUrls: ['./milestone-client.component.scss'],
})
export class MilestoneClientComponent {
  loading = false;
  contractId = 0;
  contract: ContractResponse | null = null;
  milestones: MilestoneResponse[] = [];
  activeTab = 0;
  composerOpen = false;
  editingId: number | null = null;
  statusFilter: 'ALL' | MilestoneStatus = 'ALL';
  searchTerm = '';
  sortOption: 'latest' | 'oldest' | 'amountDesc' | 'amountAsc' | 'status' = 'latest';
  pageIndex = 0;
  pageSize = 6;
  readonly pageSizeOptions = [6, 12, 24];
  paySheetOpen = false;
  selectedMilestone: MilestoneResponse | null = null;
  revisionComposerFor: number | null = null;
  revisionFeedback = '';
  refreshHistoryKey = 0;
  activeCallNotification: AppNotification | null = null;
  hasBlockingDispute = false;
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  currentUser: User | null = null;
  private requestedTab: 'milestones' | 'payments' | 'resources' | null = null;
  private requestedMilestoneId: number | null = null;
  readonly displayedColumns = ['title', 'status', 'amount', 'dueDate', 'updatedAt', 'actions'];
  readonly minDate = this.startOfToday();

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    deliverable: ['', [Validators.required, Validators.maxLength(2000)]],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDate: [null as Date | null],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly contractService: ContractService,
    private readonly milestoneService: MilestoneService,
    private readonly notificationService: NotificationService,
    private readonly disputeService: DisputeService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.showBanner('The selected contract is invalid.', 'error');
        return;
      }

      this.contractId = id;
      this.loadWorkspace();
    });

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      this.requestedTab = tab === 'milestones' || tab === 'payments' || tab === 'resources' ? tab : null;
      this.requestedMilestoneId = Number(params.get('milestoneId')) || null;
      this.applyRequestedContext();
    });

    this.notificationService.notifications$.subscribe((notifications) => {
      this.activeCallNotification = notifications.find(
        (notification) => notification.contractId === this.contractId && notification.type === 'CONTRACT_CALL_STARTED'
      ) ?? null;
    });
  }

  loadWorkspace(): void {
    this.loading = true;
    this.contractService.getById(this.contractId).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.loadBlockingDisputeState();
        this.loadMilestones();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract could not be loaded.', 'error');
      },
    });
  }

  loadMilestones(): void {
    this.milestoneService.listByContractId(this.contractId).subscribe({
      next: (milestones) => {
        this.loading = false;
        this.milestones = milestones ?? [];
        this.applyRequestedContext();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Milestones could not be loaded.', 'error');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showBanner('Complete the milestone form before saving.', 'error');
      return;
    }

    this.loading = true;
    const payload = {
      contractId: this.contractId,
      title: this.form.controls.title.value ?? '',
      deliverable: this.form.controls.deliverable.value ?? '',
      amount: this.form.controls.amount.value ?? 0,
      dueDate: this.toIsoDateString(this.form.controls.dueDate.value),
    };

    const request$ = this.editingId
      ? this.milestoneService.update(this.editingId, payload)
      : this.milestoneService.create(payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        const wasEditing = !!this.editingId;
        this.cancelEdit();
        this.showBanner(wasEditing ? 'Milestone updated.' : 'Milestone created.', 'success');
        this.loadMilestones();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Milestone could not be saved.', 'error');
      },
    });
  }

  startCreate(): void {
    this.activeTab = 1;
    this.composerOpen = true;
    this.editingId = null;
    this.selectedMilestone = null;
    this.form.reset({ title: '', deliverable: '', amount: null, dueDate: null });
  }

  startEdit(milestone: MilestoneResponse): void {
    this.activeTab = 1;
    this.composerOpen = true;
    this.selectedMilestone = milestone;
    this.editingId = milestone.id;
    this.form.patchValue({
      title: milestone.title,
      deliverable: milestone.deliverable,
      amount: milestone.amount,
      dueDate: this.parseDate(milestone.dueDate),
    });
  }

  cancelEdit(): void {
    this.composerOpen = false;
    this.editingId = null;
    this.form.reset({ title: '', deliverable: '', amount: null, dueDate: null });
  }

  selectMilestone(milestone: MilestoneResponse): void {
    this.selectedMilestone = this.selectedMilestone?.id === milestone.id ? null : milestone;
    this.revisionComposerFor = null;
    this.revisionFeedback = '';
  }

  approve(milestone: MilestoneResponse): void {
    this.loading = true;
    this.milestoneService.approve(milestone.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Milestone approved.', 'success');
        this.loadMilestones();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Approval failed.', 'error');
      },
    });
  }

  requestRevision(milestone: MilestoneResponse): void {
    if (!this.revisionFeedback.trim()) {
      this.showBanner('Add revision feedback before sending it.', 'error');
      return;
    }

    this.loading = true;
    this.milestoneService.requestRevision(milestone.id, {
      feedback: this.revisionFeedback.trim(),
      actorId: this.currentUser?.id ?? this.contract?.clientId ?? 0
    }).subscribe({
      next: () => {
        this.loading = false;
        this.revisionComposerFor = null;
        this.revisionFeedback = '';
        this.showBanner('Revision requested from the freelancer.', 'success');
        this.loadMilestones();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Revision request failed.', 'error');
      },
    });
  }

  openPaymentSheet(milestone: MilestoneResponse): void {
    this.selectedMilestone = milestone;
    this.paySheetOpen = true;
  }

  onCheckoutCreated(session: CheckoutSessionResponse): void {
    this.refreshHistoryKey += 1;
    if (!session.checkoutUrl) {
      this.showBanner('Stripe stub session created. Enable Stripe keys for hosted checkout.', 'success');
    }
  }

  onPaymentActionCompleted(): void {
    this.refreshHistoryKey += 1;
    this.loadBlockingDisputeState();
    this.loadMilestones();
  }

  badgeTone(status: MilestoneStatus): 'primary' | 'accent' | 'warn' | undefined {
    if (status === 'APPROVED' || status === 'FUNDED') return 'accent';
    if (status === 'PAID') return 'primary';
    if (status === 'REVISION_REQUESTED' || status === 'OVERDUE') return 'warn';
    return undefined;
  }

  statusLabel(status: MilestoneStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Ready for work';
      case 'SUBMITTED':
        return 'Awaiting approval';
      case 'REVISION_REQUESTED':
        return 'Revision needed';
      case 'APPROVED':
        return 'Approved';
      case 'FUNDED':
        return 'Secured';
      case 'PAID':
        return 'Completed';
      case 'OVERDUE':
        return 'Overdue';
      default:
        return status;
    }
  }

  nextStepLabel(status: MilestoneStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Waiting for the freelancer to submit the first delivery.';
      case 'SUBMITTED':
        return 'Review the delivery and approve it or request a revision.';
      case 'REVISION_REQUESTED':
        return 'Waiting for the freelancer to send an updated version.';
      case 'APPROVED':
        return 'Pay this milestone to move it into the secured stage.';
      case 'FUNDED':
        return 'Release the secured payment when you are ready to close the milestone.';
      case 'PAID':
        return 'This milestone is fully completed.';
      case 'OVERDUE':
        return 'Follow up with the freelancer or update the due date.';
      default:
        return 'Review the milestone details and continue the workflow.';
    }
  }

  get filteredMilestones(): MilestoneResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.milestones.filter((milestone) => {
      const matchesStatus = this.statusFilter === 'ALL' || milestone.status === this.statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [milestone.title, milestone.deliverable, milestone.amount.toString(), this.statusLabel(milestone.status), milestone.dueDate ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term);
    });

    return filtered.sort((left, right) => this.compareMilestones(left, right));
  }

  get pagedMilestones(): MilestoneResponse[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredMilestones.slice(start, start + this.pageSize);
  }

  get totalValue(): number {
    return this.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  }

  get approvedCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'APPROVED').length;
  }

  get paidCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'PAID').length;
  }

  get fundedCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'FUNDED').length;
  }

  get submittedCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'SUBMITTED').length;
  }

  get focusTitle(): string {
    return this.selectedMilestone?.title || this.milestones[0]?.title || 'No milestone selected';
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  onListChange(): void {
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  closePaymentSheet(): void {
    this.paySheetOpen = false;
  }

  clearRevisionComposer(): void {
    this.revisionComposerFor = null;
    this.revisionFeedback = '';
  }

  dismissActiveCallBanner(): void {
    this.activeCallNotification = null;
  }

  get activeCallUrl(): string {
    return `https://meet.jit.si/academic-contract-${this.contractId}`;
  }

  get payerId(): number | null {
    return this.currentUser?.id ?? null;
  }

  get payeeId(): number | null {
    return this.contract?.freelancerId ?? null;
  }

  private loadBlockingDisputeState(): void {
    this.disputeService.hasBlockingDispute(this.contractId).subscribe({
      next: (response) => {
        this.hasBlockingDispute = !!response.blocking;
      },
    });
  }

  private applyRequestedContext(): void {
    if (this.requestedTab === 'milestones') {
      this.activeTab = 1;
    } else if (this.requestedTab === 'payments') {
      this.activeTab = 2;
    } else if (this.requestedTab === 'resources') {
      this.activeTab = 3;
    }

    if (this.requestedMilestoneId && this.milestones.length) {
      this.selectedMilestone = this.milestones.find((milestone) => milestone.id === this.requestedMilestoneId) ?? null;
      if (this.selectedMilestone) {
        this.activeTab = 1;
      }
    }
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }

  private parseDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toIsoDateString(value: Date | null): string | null {
    if (!value) {
      return null;
    }

    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString().slice(0, 10);
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private compareMilestones(left: MilestoneResponse, right: MilestoneResponse): number {
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
