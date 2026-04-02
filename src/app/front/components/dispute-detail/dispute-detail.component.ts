import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DisputeService } from '../../services/dispute.service';
import { AuthService } from '../../services/auth.service';
import {
  DisputeDetailsResponse,
  Evidence,
  AuditEvent,
  ResolveDisputeRequest,
  UpdateDisputeRequest,
  DisputeStatus,
  ResolutionType
} from '../../models/communication';
import { MessageService, UploadResponse } from '../../services/message.service';

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
  evidenceLoading = false;
  evidences: Evidence[] = [];
  evidenceUploading = false;
  selectedEvidenceFile: File | null = null;
  evidenceCategory: string = 'OTHER';
  adminNoteDrafts: Record<number, string> = {};
  auditLoading = false;
  auditEvents: AuditEvent[] = [];
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
    private readonly authService: AuthService,
    private readonly messageService: MessageService
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
        this.loadEvidence(id);
        this.loadAudit(id);
      },
      error: () => {
        this.showAlert('Error loading', 'error');
        this.loading = false;
      }
    });
  }

  loadEvidence(disputeId: number): void {
    this.evidenceLoading = true;
    this.disputeService.listEvidence(disputeId).subscribe({
      next: (list) => {
        this.evidences = list;
        this.adminNoteDrafts = {};
        for (const ev of list) {
          this.adminNoteDrafts[ev.id] = ev.adminNote ?? '';
        }
        this.evidenceLoading = false;
      },
      error: () => {
        this.evidences = [];
        this.evidenceLoading = false;
      }
    });
  }

  loadAudit(disputeId: number): void {
    this.auditLoading = true;
    this.disputeService.listAudit(disputeId).subscribe({
      next: (events) => {
        this.auditEvents = events;
        this.auditLoading = false;
      },
      error: () => {
        this.auditEvents = [];
        this.auditLoading = false;
      }
    });
  }

  canUploadEvidence(): boolean {
    if (!this.details) return false;
    if (this.isAdmin) return true;
    if (!this.currentUserId) return false;
    return this.currentUserId === this.details.dispute.raisedByUserId;
  }

  onEvidenceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedEvidenceFile = file;
  }

  uploadEvidence(): void {
    if (!this.details) return;
    if (!this.selectedEvidenceFile) return;
    if (!this.canUploadEvidence()) return;

    this.evidenceUploading = true;
    const disputeId = this.details.dispute.id;

    this.messageService.uploadFile(this.selectedEvidenceFile).subscribe({
      next: (resp: UploadResponse) => {
        const payload = {
          fileUrl: resp.url,
          fileName: resp.fileName,
          category: this.evidenceCategory
        };
        this.disputeService.addEvidence(disputeId, payload).subscribe({
          next: () => {
            this.selectedEvidenceFile = null;
            this.evidenceCategory = 'OTHER';
            this.loadEvidence(disputeId);
            this.evidenceUploading = false;
            this.showAlert('Evidence uploaded', 'success');
          },
          error: (err) => {
            this.evidenceUploading = false;
            this.showAlert(err?.error?.message || 'Error uploading evidence', 'error');
          }
        });
      },
      error: () => {
        this.evidenceUploading = false;
        this.showAlert('Error uploading file', 'error');
      }
    });
  }

  saveAdminNote(ev: Evidence): void {
    if (!this.details) return;
    const disputeId = this.details.dispute.id;
    const newNote = (this.adminNoteDrafts[ev.id] ?? '').trim();
    this.disputeService.adminUpdateEvidenceMetadata(disputeId, ev.id, { adminNote: newNote }).subscribe({
      next: () => {
        this.loadEvidence(disputeId);
        this.showAlert('Evidence note updated', 'success');
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error updating note', 'error');
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

  getDeadlineHint(deadlineAt?: string): string {
    if (!deadlineAt) return '';
    const d = new Date(deadlineAt);
    if (isNaN(d.getTime())) return '';
    const diffMs = d.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs <= 0) return `Deadline passed`;
    if (diffDays <= 1) return `Due in ${diffDays} day`;
    return `Due in ${diffDays} days`;
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
