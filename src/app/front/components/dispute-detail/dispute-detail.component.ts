import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DisputeService } from '../../services/dispute.service';
import { AuthService } from '../../services/auth.service';
import {
  DisputeDetailsResponse,
  ResolveDisputeRequest,
  UpdateDisputeRequest,
  DisputeStatus,
  ResolutionType
} from '../../models/communication';

@Component({
  selector: 'app-dispute-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dispute-detail.component.html',
  styleUrls: ['./dispute-detail.component.scss']
})
export class DisputeDetailComponent implements OnInit {
  loading = true;
  details: DisputeDetailsResponse | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  showEditForm = false;
  editForm: UpdateDisputeRequest = { disputeType: 'QUALITY_ISSUE', reason: '' };
  updating = false;

  resolveForm: ResolveDisputeRequest = {
    resolvedByUserId: 0,
    status: 'RESOLVED',
    resolutionType: 'NO_ACTION',
    resolutionNote: '',
    refundAmount: undefined
  };
  resolving = false;
  showResolveForm = false;
  isAdmin = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly disputeService: DisputeService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const admin = this.route.snapshot.queryParamMap.get('admin') === 'true';
    this.isAdmin = admin;
    if (id) {
      this.loadDetails(+id);
    }
  }

  loadDetails(id: number): void {
    this.loading = true;
    this.disputeService.getDetails(id).subscribe({
      next: (d) => {
        this.details = d;
        this.loading = false;
        this.resolveForm.resolvedByUserId = 1; // default admin user
      },
      error: () => {
        this.showAlert('Error loading', 'error');
        this.loading = false;
      }
    });
  }

  resolve(): void {
    if (!this.details) return;
    this.resolving = true;
    this.disputeService.resolve(this.details.dispute.id, this.resolveForm).subscribe({
      next: () => {
        this.showAlert('Dispute resolved successfully', 'success');
        this.showResolveForm = false;
        this.loadDetails(this.details!.dispute.id);
        this.resolving = false;
      },
      error: () => {
        this.showAlert('Error resolving dispute', 'error');
        this.resolving = false;
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      OPEN: 'Open',
      IN_REVIEW: 'In review',
      RESOLVED: 'Resolved',
      REJECTED: 'Rejected'
    };
    return map[s] || s;
  }

  getDisputeTypeLabel(type: string): string {
    const map: Record<string, string> = {
      QUALITY_ISSUE: 'Quality issue',
      PAYMENT_ISSUE: 'Payment issue',
      DELIVERY_ISSUE: 'Delivery issue',
      OTHER: 'Other'
    };
    return map[type] || type;
  }

  getResolutionLabel(r: string): string {
    const map: Record<string, string> = {
      REFUND_TO_CLIENT: 'Client refund',
      PAY_TO_FREELANCER: 'Freelancer payment',
      SPLIT_PAYMENT: 'Split payment',
      NO_ACTION: 'No action'
    };
    return map[r] || r;
  }

  backUrl(): string {
    return this.isAdmin ? '/back/admin-disputes' : '/front/disputes';
  }

  get currentUserId(): number | null {
    return this.authService.getNumericUserId();
  }

  canEdit(): boolean {
    if (!this.details) return false;
    const d = this.details.dispute;
    if (this.isAdmin) return true;
    return this.currentUserId === d.raisedByUserId && d.status === 'OPEN';
  }

  canDelete(): boolean {
    if (!this.details) return false;
    const d = this.details.dispute;
    if (this.isAdmin) return true;
    return this.currentUserId === d.raisedByUserId && d.status === 'OPEN';
  }

  startEdit(): void {
    if (!this.details) return;
    this.editForm = { disputeType: this.details.dispute.disputeType, reason: this.details.dispute.reason };
    this.showEditForm = true;
  }

  cancelEdit(): void {
    this.showEditForm = false;
  }

  saveEdit(): void {
    if (!this.details || !this.editForm.reason?.trim()) return;
    if (!this.isAdmin && !this.currentUserId) return;
    this.updating = true;
    const id = this.details.dispute.id;
    const req = this.editForm;
    const obs = this.isAdmin
      ? this.disputeService.adminUpdate(id, req)
      : this.disputeService.update(id, req, this.currentUserId!);
    obs.subscribe({
      next: () => {
        this.showAlert('Dispute updated', 'success');
        this.showEditForm = false;
        this.loadDetails(id);
        this.updating = false;
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error updating dispute', 'error');
        this.updating = false;
      }
    });
  }

  deleteDispute(): void {
    if (!this.details || !confirm('Delete this dispute?')) return;
    if (!this.isAdmin && !this.currentUserId) return;
    const id = this.details.dispute.id;
    const obs = this.isAdmin
      ? this.disputeService.adminDelete(id)
      : this.disputeService.delete(id, this.currentUserId!);
    obs.subscribe({
      next: () => {
        this.showAlert('Dispute deleted', 'success');
        this.router.navigate([this.backUrl()]);
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error deleting dispute', 'error');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = null;
      this.alertType = null;
    }, 3000);
  }
}
