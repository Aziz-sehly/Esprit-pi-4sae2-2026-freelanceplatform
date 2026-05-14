import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MilestoneResponse, MilestoneStatus } from '../../models/milestone.model';
import { MilestoneService } from '../../services/milestone.service';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { ProjectService } from '../../services/project.service';
import { ProjectProposal } from '../../models/models';

@Component({
  selector: 'app-milestone-freelancer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './milestone-freelancer.component.html',
  styleUrls: ['./milestone-freelancer.component.scss'],
})
export class MilestoneFreelancerComponent implements OnInit {
  loading = false;
  contractsLoading = false;
  errorMsg = '';
  successMsg = '';

  contracts: ProjectProposal[] = [];
  projectTitles: Record<number, string> = {};
  contractId: number | null = null;
  milestones: MilestoneResponse[] = [];

  statusFilter: 'ALL' | MilestoneStatus = 'ALL';

  private readonly freelancerId = 101;

  constructor(
    private ms: MilestoneService,
    private proposalService: ProjectProposalService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.contractsLoading = true;
    this.proposalService.getAcceptedContractsForFreelancer(this.freelancerId).subscribe({
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
    return `Proposal #${p.id} – ${title}`;
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
      },
    });
  }

  get filteredMilestones(): MilestoneResponse[] {
    if (this.statusFilter === 'ALL') return this.milestones;
    return this.milestones.filter((m) => m.status === this.statusFilter);
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
