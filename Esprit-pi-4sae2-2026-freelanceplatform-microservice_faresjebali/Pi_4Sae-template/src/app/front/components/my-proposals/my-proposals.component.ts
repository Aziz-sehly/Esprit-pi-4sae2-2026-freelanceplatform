import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectProposal } from '../../models/models';
import { ProjectProposalService } from '../../services/project-proposal.service';

const REFRESH_INTERVAL_MS = 20000;

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-proposals.component.html',
  styleUrls: ['./my-proposals.component.scss']
})
export class MyProposalsComponent implements OnInit, OnDestroy {
  loading = true;
  proposals: ProjectProposal[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  editingId: number | null = null;
  editCoverLetter = '';
  editProposedBudget = 0;
  editDeliveryDays = 0;
  saving = false;

  // TODO: remplacer par authService.user.id
  private readonly freelancerId = 101;

  constructor(private readonly proposalService: ProjectProposalService) {}

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(true), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  load(silent = false): void {
    if (!silent) this.loading = true;
    this.loading = true;
    this.proposalService.getByFreelancer(this.freelancerId).subscribe((items) => {
      this.proposals = items;
      this.loading = false;
    });
  }

  canEditOrDelete(p: ProjectProposal): boolean {
    return p.status === 'PENDING';
  }

  startEdit(p: ProjectProposal): void {
    this.editingId = p.id;
    this.editCoverLetter = p.coverLetter;
    this.editProposedBudget = p.proposedBudget;
    this.editDeliveryDays = (p.deliveryDays ?? (parseInt(String(p.estimatedDuration || '0'), 10) || 0));
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (this.editingId == null) return;
    this.saving = true;
    this.proposalService
      .update(this.editingId, {
        coverLetter: this.editCoverLetter,
        proposedBudget: this.editProposedBudget,
        deliveryDays: this.editDeliveryDays,
        estimatedDuration: this.editDeliveryDays ? `${this.editDeliveryDays} day(s)` : ''
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.editingId = null;
          this.load();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  delete(id: number): void {
    if (!confirm('Delete this proposal?')) return;
    this.proposalService.delete(id).subscribe(() => this.load());
  }
}
