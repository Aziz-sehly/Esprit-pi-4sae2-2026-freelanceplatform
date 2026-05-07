import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Project, ProjectProposal } from '../../models/models';
import { ProjectService } from '../../services/project.service';
import { ProjectProposalService } from '../../services/project-proposal.service';
import { AuthService } from '../../services/auth.service';

const PROPOSALS_REFRESH_INTERVAL_MS = 15000;

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project?: Project;
  proposals: ProjectProposal[] = [];

  loading = true;
  proposalsLoading = true;
  private proposalsRefreshTimer: ReturnType<typeof setInterval> | null = null;

  // proposal form (freelancer)
  showProposalForm = false;
  coverLetter = '';
  proposedBudget = 0;
  /** Délai de livraison en jours (aligné API backend) */
  deliveryDays = 0;
  submitting = false;

  sort: 'priceDesc' | 'durationDesc' | '' = '';

  private get currentClientId(): number {
    return this.authService.getNumericUserId() ?? 0;
  }
  isClient = false;
  /** Vue freelancer forcée via ?as=freelancer (ex: depuis la liste Projets) */
  viewAsFreelancer = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly projectService: ProjectService,
    private readonly proposalService: ProjectProposalService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.viewAsFreelancer = this.route.snapshot.queryParamMap.get('as') === 'freelancer';
    if (!id) {
      this.router.navigate(['/front/projects']);
      return;
    }

    this.projectService.getById(id).subscribe((p) => {
      this.project = p;
      this.isClient = !!p && p.clientId === this.currentClientId && !this.viewAsFreelancer;
      this.loading = false;
      if (!p) this.router.navigate(['/front/projects']);
      else {
        this.loadProposals(false);
        if (this.isClient) {
          this.proposalsRefreshTimer = setInterval(
            () => this.loadProposals(true),
            PROPOSALS_REFRESH_INTERVAL_MS
          );
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.proposalsRefreshTimer) clearInterval(this.proposalsRefreshTimer);
  }

  loadProposals(silent = false): void {
    if (!this.project) return;
    if (!silent) this.proposalsLoading = true;
    const sort = this.sort ? (this.sort as 'priceDesc' | 'durationDesc') : undefined;
    this.proposalService.getByProject(this.project.id, sort).subscribe((items) => {
      this.proposals = items;
      this.proposalsLoading = false;
    });
  }

  back(): void {
    this.router.navigate(['/front/projects']);
  }

  deleteProject(ev: MouseEvent): void {
    ev.preventDefault();
    if (!this.project || !confirm('Delete this project?')) return;
    this.projectService.delete(this.project.id).subscribe({
      next: (ok) => {
        if (ok) {
          alert('Project deleted successfully.');
          this.router.navigate(['/front/projects']);
        } else {
          alert('Project deletion failed.');
        }
      },
      error: () => {
        alert('An error occurred while deleting the project.');
      }
    });
  }

  // Client actions
  acceptProposal(id: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.proposalService.accept(id).subscribe(() => this.loadProposals(false));
  }

  rejectProposal(id: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.proposalService.reject(id).subscribe(() => this.loadProposals(false));
  }

  hideProposal(id: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.proposalService.hide(id).subscribe(() => this.loadProposals(false));
  }

  // Freelancer: submit proposal
  openForm(): void {
    this.showProposalForm = true;
  }

  cancelForm(): void {
    this.showProposalForm = false;
    this.coverLetter = '';
    this.proposedBudget = 0;
    this.deliveryDays = 0;
  }

  submit(): void {
    if (!this.project) return;
    if (!this.coverLetter.trim()) return;

    this.submitting = true;
    this.proposalService
      .create({
        projectId: this.project.id,
        freelancerId: this.authService.getNumericUserId() ?? 0,
        coverLetter: this.coverLetter.trim(),
        proposedBudget: this.proposedBudget,
        deliveryDays: this.deliveryDays || 0,
        estimatedDuration: this.deliveryDays ? `${this.deliveryDays} day(s)` : ''
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.cancelForm();
          this.loadProposals(false);
          if (this.project) {
            this.project = {
              ...this.project,
              proposalsCount: (this.project.proposalsCount ?? 0) + 1
            };
            this.projectService.getById(this.project.id).subscribe((updated) => {
              if (updated) this.project = updated;
            });
            this.projectService.refreshProjects();
          }
        },
        error: () => {
          this.submitting = false;
        }
      });
  }
}

