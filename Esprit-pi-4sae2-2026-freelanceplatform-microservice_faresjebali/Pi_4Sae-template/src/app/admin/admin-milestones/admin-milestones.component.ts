import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilestoneResponse, MilestoneStatus } from '../../front/models/milestone.model';
import { MilestoneService } from '../../front/services/milestone.service';
import { ProjectProposalService } from '../../front/services/project-proposal.service';
import { ProjectService } from '../../front/services/project.service';
import { ProjectProposal } from '../../front/models/models';

@Component({
  selector: 'app-admin-milestones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-milestones.component.html',
  styleUrls: ['./admin-milestones.component.scss'],
})
export class AdminMilestonesComponent implements OnInit {
  loading = false;
  contractsLoading = false;
  errorMsg = '';
  successMsg = '';

  contracts: ProjectProposal[] = [];
  projectTitles: Record<number, string> = {};
  contractId: number | null = null;
  milestones: MilestoneResponse[] = [];
  statusFilter: 'ALL' | MilestoneStatus = 'ALL';

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
    this.proposalService.getAcceptedContractsForAdmin().subscribe({
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
    return `Proposal #${p.id} – ${title} (Client project, Freelancer #${p.freelancerId})`;
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
