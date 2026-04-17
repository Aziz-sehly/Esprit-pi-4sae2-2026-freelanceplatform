import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, fromEvent, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisputePlatformService } from '../../services/dispute-platform.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../../environments/environment';
import {
  DisputeDetailsResponse,
  Evidence,
  EvidenceUpdateRequest,
  DisputeInsightsResponse,
  AuditEvent,
  ResolveDisputeRequest,
  UpdateDisputeRequest,
  DisputeStatus,
  ResolutionType
} from '../../models/communication';
import { MessagePlatformService, UploadResponse } from '../../services/message-platform.service';

@Component({
  selector: 'app-dispute-detail-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dispute-detail-platform.component.html',
  styleUrls: ['./dispute-detail-platform.component.scss']
})
export class DisputeDetailPlatformComponent implements OnInit, OnDestroy {
  loading = true;
  details: DisputeDetailsResponse | null = null;
  evidenceLoading = false;
  evidences: Evidence[] = [];
  evidenceUploading = false;
  selectedEvidenceFile: File | null = null;
  evidenceCategory: string = 'OTHER';
  adminNoteDrafts: Record<number, string> = {};
  evidenceUpdating = false;
  deletingEvidenceId: number | null = null;
  editingEvidenceId: number | null = null;
  editingEvidenceCategory: string = 'OTHER';
  editingEvidenceReplacementFile: File | null = null;
  auditLoading = false;
  auditEvents: AuditEvent[] = [];
  insightsLoading = false;
  insights: DisputeInsightsResponse | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;
  highlightedEvidenceId: number | null = null;

  showEditForm = false;
  editForm: UpdateDisputeRequest = { disputeType: 'QUALITY_ISSUE', reason: '' };
  /** Admin SLA deadline editor (datetime-local value). */
  adminDeadlineInput = '';
  adminRemoveDeadline = false;
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
  fromAdminView = false;

  /** Libellé affiché pour l’auteur du litige (username depuis le user-service). */
  raisedByDisplay = '';

  private readonly destroy$ = new Subject<void>();
  /** Rafraîchit preuves + fil d’audit pour l’autre session sans recharger la page (polling + retour onglet). */
  private static readonly POLL_MS = 8000;

  @ViewChild('evidenceFileInput') private evidenceFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly disputeService: DisputePlatformService,
    private readonly authService: AuthService,
    private readonly messageService: MessagePlatformService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.fromAdminView = this.route.snapshot.queryParamMap.get('admin') === 'true';
    if (id) {
      this.loadDetails(+id);
    }

    interval(DisputeDetailPlatformComponent.POLL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (document.hidden || !this.details?.dispute?.id) return;
        this.refreshEvidenceAndAuditQuiet(this.details.dispute.id);
      });

    fromEvent(document, 'visibilitychange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (document.hidden || !this.details?.dispute?.id) return;
        this.refreshEvidenceAndAuditQuiet(this.details.dispute.id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetails(id: number): void {
    this.loading = true;
    this.disputeService.getDetails(id).subscribe({
      next: (d) => {
        this.details = d;
        this.loading = false;
        this.resolveForm.resolvedByUserId = 1; // default admin user
        this.resolveRaisedByDisplay(d.dispute.raisedByUserId);
        this.loadEvidence(id, true);
        this.loadAudit(id, true);
        if (this.isAdmin) {
          this.loadInsights(id, true);
        } else {
          this.insights = null;
          this.insightsLoading = false;
        }
      },
      error: () => {
        this.showAlert('Error loading', 'error');
        this.loading = false;
      }
    });
  }

  loadInsights(disputeId: number, showSpinner: boolean): void {
    if (!this.isAdmin) {
      this.insights = null;
      this.insightsLoading = false;
      return;
    }
    if (showSpinner) this.insightsLoading = true;
    this.disputeService.getInsights(disputeId).subscribe({
      next: (i) => {
        this.insights = i;
        if (showSpinner) this.insightsLoading = false;
      },
      error: () => {
        if (showSpinner) {
          this.insights = null;
          this.insightsLoading = false;
        }
      }
    });
  }

  loadEvidence(disputeId: number, showSpinner: boolean): void {
    if (showSpinner) this.evidenceLoading = true;
    this.disputeService.listEvidence(disputeId).subscribe({
      next: (list) => {
        this.mergeEvidenceList(list, !showSpinner);
        if (showSpinner) this.evidenceLoading = false;
      },
      error: () => {
        if (showSpinner) {
          this.evidences = [];
          this.evidenceLoading = false;
        }
      }
    });
  }

  loadAudit(disputeId: number, showSpinner: boolean): void {
    if (showSpinner) this.auditLoading = true;
    this.disputeService.listAudit(disputeId).subscribe({
      next: (events) => {
        this.auditEvents = events;
        if (showSpinner) this.auditLoading = false;
      },
      error: () => {
        if (showSpinner) {
          this.auditEvents = [];
          this.auditLoading = false;
        }
      }
    });
  }

  private refreshEvidenceAndAuditQuiet(disputeId: number): void {
    this.loadEvidence(disputeId, false);
    this.loadAudit(disputeId, false);
    if (this.isAdmin) {
      this.loadInsights(disputeId, false);
    }
  }

  trackByEvidenceId(_index: number, ev: Evidence): number {
    return ev.id;
  }

  /** Évite de remplacer le tableau si le polling renvoie le même contenu (stabilité DOM / médias). */
  private evidencesEqualSnapshot(a: Evidence[], b: Evidence[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (
        x.id !== y.id ||
        x.disputeId !== y.disputeId ||
        x.uploaderUserId !== y.uploaderUserId ||
        x.fileUrl !== y.fileUrl ||
        x.fileName !== y.fileName ||
        (x.category ?? '') !== (y.category ?? '') ||
        (x.adminNote ?? '') !== (y.adminNote ?? '') ||
        !!x.adminLocked !== !!y.adminLocked ||
        x.createdAt !== y.createdAt
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * En mode silencieux, conserve les brouillons de notes admin déjà saisis ;
   * initialise seulement les brouillons pour les preuves nouvellement apparues.
   */
  private mergeEvidenceList(list: Evidence[], silent: boolean): void {
    const incoming = list ?? [];
    if (silent && this.evidencesEqualSnapshot(this.evidences, incoming)) {
      return;
    }
    this.evidences = incoming;
    if (!this.isAdmin) return;
    if (!silent) {
      this.adminNoteDrafts = {};
      for (const ev of this.evidences) {
        this.adminNoteDrafts[ev.id] = ev.adminNote ?? '';
      }
      return;
    }
    for (const ev of this.evidences) {
      if (this.adminNoteDrafts[ev.id] === undefined) {
        this.adminNoteDrafts[ev.id] = ev.adminNote ?? '';
      }
    }
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
            if (this.evidenceFileInput?.nativeElement) {
              this.evidenceFileInput.nativeElement.value = '';
            }
            this.loadEvidence(disputeId, true);
            this.loadAudit(disputeId, true);
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
        this.loadEvidence(disputeId, true);
        this.loadAudit(disputeId, true);
        this.showAlert('Evidence note updated', 'success');
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error updating note', 'error');
      }
    });
  }

  canManageEvidence(ev: Evidence): boolean {
    if (this.isAdmin) return true;
    const uid = this.currentUserId;
    if (!uid) return false;
    if (uid !== ev.uploaderUserId) return false;
    return !Boolean(ev.adminLocked);
  }

  canDeleteEvidence(ev: Evidence): boolean {
    if (this.isAdmin) return true;
    const uid = this.currentUserId;
    const disputeOwner = this.details?.dispute?.raisedByUserId;
    if (!uid) return false;
    if (Boolean(ev.adminLocked)) return false;
    return uid === ev.uploaderUserId || uid === disputeOwner;
  }

  isEvidenceLockedForUser(ev: Evidence): boolean {
    if (this.isAdmin) return false;
    const uid = this.currentUserId;
    if (!uid) return false;
    return uid === ev.uploaderUserId && Boolean(ev.adminLocked);
  }

  startEvidenceEdit(ev: Evidence): void {
    if (!this.canManageEvidence(ev)) return;
    this.editingEvidenceId = ev.id;
    this.editingEvidenceCategory = ev.category?.trim() || 'OTHER';
    this.editingEvidenceReplacementFile = null;
  }

  cancelEvidenceEdit(): void {
    this.editingEvidenceId = null;
    this.editingEvidenceCategory = 'OTHER';
    this.editingEvidenceReplacementFile = null;
  }

  onEvidenceReplacementSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.editingEvidenceReplacementFile = input?.files?.[0] ?? null;
  }

  saveEvidenceEdit(ev: Evidence): void {
    if (!this.details || !this.canManageEvidence(ev)) return;
    const disputeId = this.details.dispute.id;
    const nextCategory = this.editingEvidenceCategory?.trim() || ev.category || 'OTHER';
    const hasCategoryChange = nextCategory !== (ev.category || 'OTHER');
    const replacement = this.editingEvidenceReplacementFile;

    if (!hasCategoryChange && !replacement) {
      this.showAlert('No evidence changes to save', 'error');
      return;
    }

    this.evidenceUpdating = true;
    const finish = () => {
      this.evidenceUpdating = false;
      this.cancelEvidenceEdit();
      this.loadEvidence(disputeId, true);
      this.loadAudit(disputeId, true);
    };

    const submit = (payload: EvidenceUpdateRequest) => {
      this.disputeService.updateEvidence(disputeId, ev.id, payload).subscribe({
        next: () => {
          this.showAlert('Evidence updated', 'success');
          finish();
        },
        error: (err) => {
          this.evidenceUpdating = false;
          this.showAlert(err?.error?.message || 'Error updating evidence', 'error');
        }
      });
    };

    if (!replacement) {
      submit({ category: nextCategory });
      return;
    }

    this.messageService.uploadFile(replacement).subscribe({
      next: (resp: UploadResponse) => {
        submit({
          category: nextCategory,
          fileUrl: resp.url,
          fileName: resp.fileName
        });
      },
      error: () => {
        this.evidenceUpdating = false;
        this.showAlert('Error uploading replacement file', 'error');
      }
    });
  }

  deleteEvidence(ev: Evidence): void {
    if (!this.details || !this.canDeleteEvidence(ev)) return;
    if (!confirm('Delete this evidence?')) return;
    const disputeId = this.details.dispute.id;
    this.deletingEvidenceId = ev.id;
    this.disputeService.deleteEvidence(disputeId, ev.id).subscribe({
      next: () => {
        this.showAlert('Evidence deleted', 'success');
        if (this.editingEvidenceId === ev.id) {
          this.cancelEvidenceEdit();
        }
        this.loadEvidence(disputeId, true);
        this.loadAudit(disputeId, true);
        this.deletingEvidenceId = null;
      },
      error: (err) => {
        this.deletingEvidenceId = null;
        this.showAlert(err?.error?.message || 'Error deleting evidence', 'error');
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

  asPercent(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '-';
    return `${Math.round(value * 100)}%`;
  }

  backUrl(): string {
    return this.fromAdminView && this.isAdmin ? '/back/admin-disputes' : '/front/disputes';
  }

  slaRiskLabel(probability: number | null | undefined): string {
    if (probability == null || Number.isNaN(probability)) return 'Unknown risk';
    if (probability >= 0.8) return 'Critical risk';
    if (probability >= 0.6) return 'High risk';
    if (probability >= 0.35) return 'Moderate risk';
    return 'Low risk';
  }

  escalationLabel(score: number | null | undefined): string {
    if (score == null || Number.isNaN(score)) return 'Unknown priority';
    if (score >= 0.8) return 'Immediate attention';
    if (score >= 0.6) return 'High priority';
    if (score >= 0.35) return 'Monitor closely';
    return 'Normal priority';
  }

  duplicateLabel(similarity: number | null | undefined): string {
    if (similarity == null || Number.isNaN(similarity)) return 'No signal';
    if (similarity >= 0.85) return 'Very likely duplicate';
    if (similarity >= 0.65) return 'Possible duplicate';
    if (similarity >= 0.45) return 'Weak overlap';
    return 'Likely unique case';
  }

  trustLabel(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return 'Unknown';
    if (value >= 0.7) return 'High historical reliability';
    if (value >= 0.45) return 'Neutral historical reliability';
    return 'Low historical reliability';
  }

  evidenceLabelDescription(label: string | null | undefined): string {
    const normalized = (label ?? '').toUpperCase();
    if (normalized === 'STRONG') return 'Clear and actionable proof';
    if (normalized === 'MEDIUM') return 'Useful but incomplete proof';
    if (normalized === 'WEAK') return 'Limited proof quality';
    return 'Unrated evidence';
  }

  jumpToEvidence(evidenceId: number): void {
    const target = document.getElementById(`evidence-card-${evidenceId}`);
    if (!target) {
      this.showAlert(`Evidence ${evidenceId} not found in this dispute`, 'error');
      return;
    }
    this.highlightedEvidenceId = evidenceId;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      if (this.highlightedEvidenceId === evidenceId) {
        this.highlightedEvidenceId = null;
      }
    }, 2200);
  }

  private resolveRaisedByDisplay(userId: number | null | undefined): void {
    this.raisedByDisplay = '';
    if (userId == null) return;
    const self = this.authService.getCurrentUser();
    if (self?.id === userId) {
      this.raisedByDisplay = [self.firstName, self.lastName].filter(Boolean).join(' ').trim() || self.email;
      return;
    }
    this.authService.getPublicUser(userId).subscribe({
      next: (u) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
        if (name) {
          this.raisedByDisplay = name;
          return;
        }
        const em = u.email?.trim();
        if (em) {
          this.raisedByDisplay = em;
          return;
        }
        this.raisedByDisplay = `User #${userId}`;
      },
      error: () => {
        this.raisedByDisplay = `User #${userId}`;
      }
    });
  }

  /** URL absolue pour lecteurs média (prod : gateway). */
  resolveMediaUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = environment.messageApiBase.replace(/\/$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  isImageEvidence(ev: Evidence): boolean {
    const path = `${ev.fileName ?? ''} ${ev.fileUrl ?? ''}`.toLowerCase();
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(path);
  }

  isVideoEvidence(ev: Evidence): boolean {
    const path = `${ev.fileName ?? ''} ${ev.fileUrl ?? ''}`.toLowerCase();
    return /\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi)(\?|$)/i.test(path);
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
    this.adminRemoveDeadline = !this.details.dispute.deadlineAt;
    this.adminDeadlineInput = this.formatDeadlineForDatetimeLocal(this.details.dispute.deadlineAt);
    this.showEditForm = true;
  }

  cancelEdit(): void {
    this.showEditForm = false;
    this.adminDeadlineInput = '';
    this.adminRemoveDeadline = false;
  }

  saveEdit(): void {
    if (!this.details || !this.editForm.reason?.trim()) return;
    if (!this.isAdmin && !this.currentUserId) return;
    this.updating = true;
    const id = this.details.dispute.id;
    const req: UpdateDisputeRequest = { disputeType: this.editForm.disputeType, reason: this.editForm.reason };
    if (this.isAdmin) {
      if (this.adminRemoveDeadline) {
        req.removeDeadline = true;
      } else if (this.adminDeadlineInput?.trim()) {
        req.deadlineAt = this.datetimeLocalToApi(this.adminDeadlineInput.trim());
      }
    }
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

  /** `datetime-local` expects `yyyy-MM-ddTHH:mm` from API `deadlineAt`. */
  formatDeadlineForDatetimeLocal(deadlineAt: string | undefined): string {
    if (!deadlineAt) return '';
    const m = deadlineAt.trim().match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return m ? m[1] : '';
  }

  /** Backend expects `yyyy-MM-dd'T'HH:mm:ss` (see {@code UpdateDisputeRequest}). */
  datetimeLocalToApi(value: string): string {
    if (value.length === 16) return `${value}:00`;
    return value;
  }
}
