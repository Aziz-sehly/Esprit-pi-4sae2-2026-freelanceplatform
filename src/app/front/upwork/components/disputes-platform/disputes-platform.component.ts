import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DisputePlatformService } from '../../services/dispute-platform.service';
import { Contract, ContractService } from '../../../services/Contract.service';
import { AuthService } from '../../../services/auth.service';
import {
  Dispute,
  CreateDisputeRequest,
  UpdateDisputeRequest,
  DisputeStatus
} from '../../models/communication';

@Component({
  selector: 'app-disputes-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './disputes-platform.component.html',
  styleUrls: ['./disputes-platform.component.scss']
})
export class DisputesPlatformComponent implements OnInit {
  loading = true;
  disputes: Dispute[] = [];
  private allDisputesFromApi: Dispute[] = [];

  filterStatus = '';
  /** Filtre API : contrat (vide = tous vos litiges). */
  filterContractId: number | null = null;

  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  /** Contrats de l’utilisateur (sélection auto de l’autre partie). */
  myContracts: Contract[] = [];
  userNameCache: Record<number, string> = {};
  /** Contrat choisi pour créer un litige (id). */
  selectedContractForCreate: number | null = null;

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
    private readonly disputeService: DisputePlatformService,
    private readonly contractService: ContractService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMyContracts();
    this.loadDisputes();
  }

  loadMyContracts(): void {
    const me = this.authService.getCurrentUser();
    if (!me?.id) {
      this.myContracts = [];
      return;
    }
    this.contractService.getAllForUser(me.id).subscribe((list) => {
      this.myContracts = list ?? [];
      this.myContracts.forEach(c => this.contractService.enrichForDisplay(c));
      const otherIds = new Set<number>();
      for (const c of this.myContracts) {
        const oid = c.clientId === me.id ? c.freelancerId : c.clientId;
        if (oid != null && oid !== me.id) otherIds.add(oid);
      }
      otherIds.forEach((id) => {
        this.authService.getPublicUser(id).subscribe((u) => {
          this.userNameCache[id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || `User ${id}`;
        });
      });
    });
  }

  getOtherPartyName(c: Contract): string {
    const me = this.authService.getCurrentUser();
    if (!me) return '';
    const oid = c.clientId === me.id ? c.freelancerId : c.clientId;
    return this.userNameCache[oid] || `User ${oid}`;
  }

  onCreateContractSelected(): void {
    const me = this.authService.getCurrentUser();
    const cid = this.selectedContractForCreate;
    if (!me?.id || cid == null || cid <= 0) {
      this.createForm.contractId = 0;
      this.createForm.contactUserId = null;
      return;
    }
    const c = this.myContracts.find((x) => x.id === cid);
    if (!c) return;
    this.createForm.contractId = c.id;
    this.createForm.contactUserId = c.clientId === me.id ? c.freelancerId : c.clientId;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.selectedContractForCreate = null;
      this.createForm.contractId = 0;
      this.createForm.contactUserId = null;
      this.createForm.reason = '';
    }
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
    this.disputes = [...this.allDisputesFromApi];
  }

  createDispute(): void {
    if (!this.createForm.reason?.trim()) {
      this.showAlert('La description du litige est obligatoire', 'error');
      return;
    }
    this.onCreateContractSelected();
    const cid = Number(this.createForm.contractId);
    if (!cid || cid <= 0) {
      this.showAlert('Choisissez un contrat', 'error');
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
        this.showAlert('Litige créé', 'success');
        this.showCreateForm = false;
        this.selectedContractForCreate = null;
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
        this.showAlert('Erreur à la création du litige', 'error');
        this.creating = false;
      }
    });
  }

  applyFilter(): void {
    this.loadDisputes();
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
