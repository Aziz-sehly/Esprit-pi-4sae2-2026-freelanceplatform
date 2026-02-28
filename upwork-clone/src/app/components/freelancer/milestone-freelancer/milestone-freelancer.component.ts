import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MilestoneResponse, MilestoneStatus } from '../../../models/milestone.model';
import { MilestoneService } from '../../../services/milestone.service';

@Component({
  selector: 'app-milestone-freelancer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './milestone-freelancer.component.html',
  styleUrls: ['./milestone-freelancer.component.scss']
})
export class MilestoneFreelancerComponent {
  loading = false;
  errorMsg = '';
  successMsg = '';

  contractId: number | null = null;
  milestones: MilestoneResponse[] = [];

  statusFilter: 'ALL' | MilestoneStatus = 'ALL';

  constructor(private ms: MilestoneService) {}

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

  submit(m: MilestoneResponse): void {
    this.clearMsgs();

    if (!confirm(`Submit milestone #${m.id}?`)) return;

    this.loading = true;
    this.ms.submit(m.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Milestone submitted successfully.';
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Submit failed.';
      }
    });
  }

  get filteredMilestones(): MilestoneResponse[] {
    if (this.statusFilter === 'ALL') return this.milestones;
    return this.milestones.filter(m => m.status === this.statusFilter);
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