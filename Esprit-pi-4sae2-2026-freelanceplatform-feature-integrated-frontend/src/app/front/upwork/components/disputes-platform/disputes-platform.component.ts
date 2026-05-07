import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  /** Contact auto-dérivé depuis les litiges déjà chargés: contractId -> contactUserId */
  private contractContactById: Record<number, number> = {};
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
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly contractService: ContractService,
  ) {}

  ngOnInit(): void {
    this.applyRoutePrefill();
    this.loadDisputes();
  }

  private applyRoutePrefill(): void {
    const contractId = Number(this.route.snapshot.queryParamMap.get('contractId') || 0);
    const contactUserId = Number(this.route.snapshot.queryParamMap.get('contactUserId') || 0);
    const openCreate = this.route.snapshot.queryParamMap.get('openCreate') === '1';

    if (contractId > 0) {
      this.filterContractId = contractId;
      this.selectedContractForCreate = contractId;
      this.createForm.contractId = contractId;
      this.myContracts = [{ id: contractId, title: `Contract #${contractId}` } as Contract];
    }

    if (contactUserId > 0 && contractId > 0) {
      this.contractContactById[contractId] = contactUserId;
      this.createForm.contactUserId = contactUserId;
      this.authService.getPublicUser(contactUserId).subscribe((u) => {
        this.userNameCache[contactUserId] = [u.firstName, u.lastName].filter(Boolean).join(' ') || `User ${contactUserId}`;
      });
    } else if (contractId > 0) {
      this.resolveContractCounterparty(contractId);
    }

    if (openCreate) {
      this.showCreateForm = true;
    }
  }

  /** Build contract selector from current disputes to avoid forbidden contract-service calls. */
  private rebuildContractsFromDisputes(): void {
    const me = this.authService.getCurrentUser();
    const byContractId = new Map<number, number | null>();
    for (const d of this.allDisputesFromApi) {
      if (!d?.contractId) continue;
      // Derive the counterparty for the current viewer from either side.
      let other: number | null = null;
      if (me?.id) {
        if (d.raisedByUserId === me.id) {
          other = d.contactUserId ?? null;
        } else if (d.contactUserId === me.id) {
          other = d.raisedByUserId ?? null;
        }
        if (other === me.id) {
          // Ignore corrupted historical rows where contact == creator/self.
          other = null;
        }
      }
      if (!byContractId.has(d.contractId)) {
        byContractId.set(d.contractId, other);
      } else if (!byContractId.get(d.contractId) && other) {
        // Prefer first valid non-self counterparty if present in any row.
        byContractId.set(d.contractId, other);
      }
    }

    this.contractContactById = {};
    this.myContracts = Array.from(byContractId.entries()).map(([contractId, contactId]) => {
      if (contactId != null) this.contractContactById[contractId] = contactId;
      return {
        id: contractId,
        title: `Contract #${contractId}`,
      } as Contract;
    });

    const contactIds = new Set<number>(Object.values(this.contractContactById));
    contactIds.forEach((id) => {
      this.authService.getPublicUser(id).subscribe((u) => {
        this.userNameCache[id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || `User ${id}`;
      });
    });

    if (this.createForm.contractId > 0 && !this.myContracts.some((c) => c.id === this.createForm.contractId)) {
      this.myContracts = [
        ...this.myContracts,
        { id: this.createForm.contractId, title: `Contract #${this.createForm.contractId}` } as Contract,
      ];
    }
  }

  getOtherPartyName(c: Contract): string {
    const oid = this.contractContactById[c.id];
    if (!oid) return '';
    return this.userNameCache[oid] || `User ${oid}`;
  }

  onCreateContractSelected(): void {
    const cid = this.selectedContractForCreate;
    if (cid == null || cid <= 0) {
      this.createForm.contractId = 0;
      this.createForm.contactUserId = null;
      return;
    }
    this.createForm.contractId = cid;
    // Always resolve from the contract for the selected user context.
    // This avoids stale/corrupted contact values from old disputes.
    this.createForm.contactUserId = null;
    this.resolveContractCounterparty(cid);
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
    if (this.authService.hasRole('ADMIN')) return true;
    const uid = this.currentUserId;
    if (!uid) return false;
    return d.raisedByUserId === uid && d.status === 'OPEN';
  }

  canDelete(d: Dispute): boolean {
    if (this.authService.hasRole('ADMIN')) return true;
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
        this.rebuildContractsFromDisputes();
        this.applyContactFilter();
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error loading disputes', 'error');
        this.allDisputesFromApi = [];
        this.disputes = [];
        this.myContracts = [];
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

    const doCreate = (contactUserId: number | null): void => {
      if (!contactUserId || contactUserId <= 0) {
        this.showAlert('Impossible de déterminer la contrepartie du contrat. Réessayez depuis la page du contrat.', 'error');
        return;
      }

      const payload: CreateDisputeRequest = {
        contractId: cid,
        contactUserId,
        disputeType: this.createForm.disputeType,
        reason: this.createForm.reason.trim()
      };

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
        error: (err) => {
          const backendMsg =
            err?.error?.message ||
            err?.error?.error ||
            (typeof err?.error === 'string' ? err.error : '');
          const msg = String(backendMsg || '').toLowerCase();
          if (msg.includes('contactuserid cannot be the same as creator')) {
            this.showAlert('Le contact du litige ne peut pas être vous-même. Sélectionnez le bon contrat/contrepartie.', 'error');
          } else if (msg.includes('bad request') || err?.status === 400) {
            this.showAlert(backendMsg || 'Requête invalide: vérifiez contrat, contrepartie et description.', 'error');
          } else {
            this.showAlert(backendMsg || 'Erreur à la création du litige', 'error');
          }
          this.creating = false;
        }
      });
    };

    // Always resolve counterparty from contract before create.
    // Do not trust cached values from previous rows.
    this.resolveContractCounterparty(cid, doCreate);
  }

  private resolveContractCounterparty(contractId: number, done?: (contactUserId: number | null) => void): void {
    const me = this.authService.getCurrentUser();
    if (!me?.id) {
      done?.(null);
      return;
    }
    this.contractService.getContractById(contractId).subscribe({
      next: (c) => {
        const contact = c.clientId === me.id ? c.freelancerId : c.clientId;
        if (contact && contact > 0) {
          this.contractContactById[contractId] = contact;
          this.createForm.contactUserId = contact;
          this.authService.getPublicUser(contact).subscribe((u) => {
            this.userNameCache[contact] = [u.firstName, u.lastName].filter(Boolean).join(' ') || `User ${contact}`;
          });
          done?.(contact);
          return;
        }
        done?.(null);
      },
      error: () => done?.(null),
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
