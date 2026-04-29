import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DisputeService } from '../../services/dispute.service';
import { AuthService } from '../../services/auth.service';
import {
  Dispute,
  CreateDisputeRequest,
  UpdateDisputeRequest,
  DisputeStatus
} from '../../models/communication';

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.scss']
})
export class DisputesComponent implements OnInit {
  loading = true;
  disputes: Dispute[] = [];
  private allDisputesFromApi: Dispute[] = [];

  filterStatus = '';
  /** Filtre API : contrat (vide = tous vos litiges). */
  filterContractId: number | null = null;
  /** Filtre local après chargement : contact (utilisateur). */
  filterContactUserId: number | null = null;

  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  createForm: CreateDisputeRequest = {
    contractId: 0,
    contactUserId: null,
    disputeType: 'QUALITY_ISSUE',
    reason: ''
  };
  creating = false;
  showCreateForm = false;

  editingDispute: Dispute | null = null;
  editForm: UpdateDisputeRequest = { disputeType: 'QUALITY_ISSUE', reason: '' };
  updating = false;

  constructor(
    private readonly disputeService: DisputeService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  get currentUserId(): number | null {
    return this.authService.getNumericUserId();
  }

  canEdit(d: Dispute): boolean {
    const uid = this.currentUserId;
    if (!uid) return false;
    return d.raisedByUserId === uid && d.status === 'OPEN';
  }

  canDelete(d: Dispute): boolean {
    return this.canEdit(d);
  }

  startEdit(d: Dispute): void {
    this.editingDispute = d;
    this.editForm = { disputeType: d.disputeType, reason: d.reason };
  }

  cancelEdit(): void {
    this.editingDispute = null;
  }

  saveEdit(): void {
    if (!this.editingDispute || !this.editForm.reason?.trim()) return;
    const uid = this.currentUserId;
    if (!uid) return;
    this.updating = true;
    this.disputeService.update(this.editingDispute.id, this.editForm, uid).subscribe({
      next: () => {
        this.showAlert('Dispute updated', 'success');
        this.editingDispute = null;
        this.loadDisputes();
        this.updating = false;
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error updating dispute', 'error');
        this.updating = false;
      }
    });
  }

  deleteDispute(d: Dispute): void {
    if (!confirm('Delete this dispute?')) return;
    const uid = this.currentUserId;
    if (!uid) return;
    this.disputeService.delete(d.id, uid).subscribe({
      next: () => {
        this.showAlert('Dispute deleted', 'success');
        this.loadDisputes();
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Error deleting dispute', 'error');
      }
    });
  }

  loadDisputes(): void {
    this.loading = true;
    const status = this.filterStatus ? (this.filterStatus as DisputeStatus) : undefined;
    const cid = this.filterContractId != null && this.filterContractId > 0 ? this.filterContractId : undefined;

    this.disputeService.list(cid, status).subscribe({
      next: (list) => {
        this.allDisputesFromApi = list ?? [];
        this.applyContactFilter();
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error loading disputes', 'error');
        this.allDisputesFromApi = [];
        this.disputes = [];
        this.loading = false;
      }
    });
  }

  private applyContactFilter(): void {
    const f = this.filterContactUserId;
    if (f != null && Number.isFinite(f) && f > 0) {
      this.disputes = this.allDisputesFromApi.filter(
        (d) => d.contactUserId != null && Number(d.contactUserId) === f
      );
    } else {
      this.disputes = [...this.allDisputesFromApi];
    }
  }

  createDispute(): void {
    if (!this.createForm.reason?.trim()) {
      this.showAlert('Dispute reason is required', 'error');
      return;
    }
    const cid = Number(this.createForm.contractId);
    if (!cid || cid <= 0) {
      this.showAlert('A valid contract ID is required', 'error');
      return;
    }

    const payload: CreateDisputeRequest = {
      contractId: cid,
      disputeType: this.createForm.disputeType,
      reason: this.createForm.reason.trim()
    };
    const contact = this.createForm.contactUserId;
    if (contact != null && contact > 0) {
      payload.contactUserId = contact;
    }

    this.creating = true;
    this.disputeService.create(payload).subscribe({
      next: () => {
        this.showAlert('Dispute created successfully', 'success');
        this.showCreateForm = false;
        this.createForm = {
          contractId: 0,
          contactUserId: null,
          disputeType: this.createForm.disputeType,
          reason: ''
        };
        this.loadDisputes();
        this.creating = false;
      },
      error: () => {
        this.showAlert('Error creating dispute', 'error');
        this.creating = false;
      }
    });
  }

  applyFilter(): void {
    this.loadDisputes();
  }

  onContactFilterChange(): void {
    this.applyContactFilter();
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

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'status-open';
      case 'IN_REVIEW':
        return 'status-review';
      case 'RESOLVED':
        return 'status-resolved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'Open';
      case 'IN_REVIEW':
        return 'In review';
      case 'RESOLVED':
        return 'Resolved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status || '-';
    }
  }

  getDisputeTypeLabel(type: string): string {
    const map: Record<string, string> = {
      QUALITY_ISSUE: 'Quality issue',
      PAYMENT_ISSUE: 'Payment issue',
      DELIVERY_ISSUE: 'Delivery issue',
      OTHER: 'Other'
    };
    return map[type] || type || '-';
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
