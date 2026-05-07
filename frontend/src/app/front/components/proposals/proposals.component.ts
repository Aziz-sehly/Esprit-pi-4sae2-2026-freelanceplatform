import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, ProjectProposal } from '../../models/models';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

const REFRESH_INTERVAL_MS = 15000;

@Component({
  selector: 'app-proposals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proposals.component.html',
  styleUrls: ['./proposals.component.scss']
})
export class ProposalsComponent implements OnInit, OnDestroy {
  loading = true;
  proposals: ProjectProposal[] = [];
  projectMap: Record<number, Project> = {};
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  private get clientId(): number {
    return this.authService.getNumericUserId() ?? 0;
  }

  constructor(
    private readonly proposalService: ProjectProposalService,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load(false);
    this.refreshTimer = setInterval(() => this.load(true), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  load(silent = false): void {
    if (!silent) this.loading = true;
    this.proposalService.getProposalsForClient(this.clientId).subscribe((items) => {
      this.proposals = items;
      const projectIds = [...new Set(items.map((p) => p.projectId))];
      projectIds.forEach((pid) => {
        this.projectService.getById(pid).subscribe((proj) => {
          if (proj) this.projectMap[pid] = proj;
        });
      });
      this.loading = false;
    });
  }

  getProjectTitle(projectId: number): string {
    return this.projectMap[projectId]?.title ?? 'Project';
  }

  canAcceptOrReject(p: ProjectProposal): boolean {
    return p.status === 'PENDING';
  }

  accept(id: number): void {
    this.proposalService.accept(id).subscribe(() => this.load());
  }

  reject(id: number): void {
    if (!confirm('Reject this proposal?')) return;
    this.proposalService.reject(id).subscribe(() => this.load());
  }

  cancel(id: number): void {
    if (!confirm('Cancel this proposal?')) return;
    this.proposalService.cancel(id).subscribe(() => this.load());
  }
}
