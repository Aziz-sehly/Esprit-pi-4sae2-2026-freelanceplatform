import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ContractResponse } from '../../../models/contract.model';
import { MilestoneResponse, MilestoneStatus } from '../../../models/milestone.model';
import { ContractService } from '../../../services/contract.service';
import { MilestoneService } from '../../../services/milestone.service';
import { NotificationService } from '../../../services/notification.service';
import { AppNotification } from '../../../models/notification.model';
import { ContractChatComponent } from '../../shared/contract-chat/contract-chat.component';
import { ContractCallComponent } from '../../shared/contract-call/contract-call.component';
import { PaymentHistoryComponent } from '../../client/payment-history/payment-history.component';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';

@Component({
  selector: 'app-milestone-freelancer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    ContractChatComponent,
    ContractCallComponent,
    PaymentHistoryComponent,
    ResourcesPanelComponent,
  ],
  templateUrl: './milestone-freelancer.component.html',
  styleUrls: ['./milestone-freelancer.component.scss'],
})
export class MilestoneFreelancerComponent {
  loading = false;
  contractId = 0;
  contract: ContractResponse | null = null;
  milestones: MilestoneResponse[] = [];
  activeTab = 0;
  selectedMilestoneId: number | null = null;
  searchTerm = '';
  statusFilter: 'ALL' | MilestoneStatus = 'ALL';
  sortOption: 'latest' | 'oldest' | 'amountDesc' | 'amountAsc' | 'status' = 'latest';
  pageIndex = 0;
  pageSize = 6;
  readonly pageSizeOptions = [6, 12, 24];
  activeCallNotification: AppNotification | null = null;
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  private requestedTab: 'milestones' | 'payments' | 'resources' | null = null;
  private requestedMilestoneId: number | null = null;
  readonly displayedColumns = ['title', 'status', 'amount', 'dueDate', 'updatedAt', 'actions'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly contractService: ContractService,
    private readonly milestoneService: MilestoneService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
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
        this.showBanner(err?.error?.message || 'Freelancer milestones could not be loaded.', 'error');
      },
    });
  }

  submit(milestone: MilestoneResponse): void {
    this.selectedMilestoneId = milestone.id;
    this.loading = true;
    this.milestoneService.submit(milestone.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner(
          milestone.status === 'REVISION_REQUESTED'
            ? 'Revision resubmitted for review.'
            : 'Milestone submitted for client review.',
          'success'
        );
        this.loadMilestones();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Submit failed.', 'error');
      },
    });
  }

  selectMilestone(milestone: MilestoneResponse): void {
    this.selectedMilestoneId = this.selectedMilestoneId === milestone.id ? null : milestone.id;
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

  actionLabel(status: MilestoneStatus): string {
    return status === 'REVISION_REQUESTED' ? 'Resubmit for review' : 'Mark ready for review';
  }

  nextStepLabel(status: MilestoneStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Upload the deliverables in milestone resources, then mark the milestone ready for client review.';
      case 'SUBMITTED':
        return 'The client needs to approve this milestone or request a revision.';
      case 'REVISION_REQUESTED':
        return 'Update the deliverables and resubmit this milestone for review.';
      case 'APPROVED':
        return 'The client can now move this milestone into the payment flow.';
      case 'FUNDED':
        return 'Payment is secured. The client still needs to release it to finish the milestone.';
      case 'PAID':
        return 'This milestone is complete and paid out.';
      case 'OVERDUE':
        return 'Coordinate with the client and update the delivery as soon as possible.';
      default:
        return 'Review the milestone details and continue the workflow.';
    }
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }

  get selectedMilestone(): MilestoneResponse | null {
    return this.milestones.find((milestone) => milestone.id === this.selectedMilestoneId) ?? null;
  }

  get submittedCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'SUBMITTED').length;
  }

  get revisionCount(): number {
    return this.milestones.filter((milestone) => milestone.status === 'REVISION_REQUESTED').length;
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

  dismissActiveCallBanner(): void {
    this.activeCallNotification = null;
  }

  get activeCallUrl(): string {
    return `https://meet.jit.si/academic-contract-${this.contractId}`;
  }

  onListChange(): void {
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private applyRequestedContext(): void {
    if (this.requestedTab === 'payments') {
      this.activeTab = 2;
    } else if (this.requestedTab === 'resources') {
      this.activeTab = 1;
    } else {
      this.activeTab = 0;
    }

    if (this.requestedMilestoneId && this.milestones.length) {
      this.selectedMilestoneId = this.milestones.find((milestone) => milestone.id === this.requestedMilestoneId)?.id ?? null;
      if (this.selectedMilestoneId) {
        this.activeTab = 0;
      }
    }
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
