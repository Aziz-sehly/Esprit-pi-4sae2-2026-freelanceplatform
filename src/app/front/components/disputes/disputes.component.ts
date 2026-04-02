import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DisputeService } from '../../services/dispute.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import {
  Dispute,
  CreateDisputeRequest,
  ConversationDto,
  UserDto,
  UpdateDisputeRequest,
  DisputeStatus
} from '../../models/communication';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

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
  filterStatus = '';
  filterOtherUserId: number | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  conversations: ConversationDto[] = [];
  selectedOtherUserId: number | null = null;
  users: UserDto[] = [];

  createForm: CreateDisputeRequest = {
    contractId: 0,
    raisedByUserId: 0,
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
    private readonly authService: AuthService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    const uid = this.authService.getNumericUserId();
    if (uid) this.createForm.raisedByUserId = uid;

    // Charger les “contacts” disponibles (autres utilisateurs) via les conversations messages.
    if (uid) {
      // Récupère les noms/emails des contacts pour afficher un dropdown lisible.
      this.messageService.getUsers(uid).subscribe({
        next: (uList) => {
          this.users = uList ?? [];
        },
        error: () => {
          this.users = [];
        }
      });

      this.messageService.getConversations(uid).subscribe({
        next: (list) => {
          this.conversations = list;
          // Pré-sélectionne le premier contact si disponible.
          if (!this.selectedOtherUserId && list.length > 0) {
            this.selectedOtherUserId = list[0].otherUserId;
            this.setContractFromOtherUser(this.selectedOtherUserId);
          }
        },
        error: () => {
          this.conversations = [];
        }
      });
    }

    this.loadDisputes();
  }

  get currentUserId(): number | null {
    return this.authService.getNumericUserId();
  }

  get uniqueOtherUsers(): number[] {
    const set = new Set<number>();
    for (const c of this.conversations ?? []) {
      if (c?.otherUserId == null) continue;
      set.add(c.otherUserId);
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  getUserLabel(userId: number): string {
    const u = this.users?.find(x => x?.id === userId);
    const first = u?.firstName?.trim();
    const last = u?.lastName?.trim();
    const fullName = first || last ? [first, last].filter(Boolean).join(' ') : null;
    if (fullName) return fullName;
    if (u?.username?.trim()) return u.username!.trim();
    if (u?.email?.trim()) return u.email!.trim();
    return `User ${userId}`;
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

    // Si un contact est sélectionné, on peut avoir plusieurs conversations (donc plusieurs contractId).
    if (this.filterOtherUserId != null) {
      const contractIds = this.conversations
        .filter(c => c.otherUserId === this.filterOtherUserId)
        .map(c => c.contractId);

      const deduped = Array.from(new Set<number>(contractIds));
      if (deduped.length === 0) {
        this.disputes = [];
        this.loading = false;
        return;
      }

      const requests = deduped.map(cid => this.disputeService.list(cid, status));
      forkJoin(requests).pipe(
        map((lists) => lists.flat()),
        map((merged) => Array.from(new Map(merged.map(d => [d.id, d])).values()))
      ).subscribe({
        next: (list) => {
          this.disputes = list;
          this.loading = false;
        },
        error: () => {
          this.showAlert('Error loading disputes', 'error');
          this.loading = false;
        }
      });
      return;
    }

    this.disputeService.list(undefined, status).subscribe({
      next: (list) => {
        this.disputes = list;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error loading disputes', 'error');
        this.loading = false;
      }
    });
  }

  createDispute(): void {
    if (!this.createForm.reason?.trim()) {
      this.showAlert('Dispute reason is required', 'error');
      return;
    }
    if (!this.createForm.contractId || !this.createForm.raisedByUserId) {
      this.showAlert('Select a user to dispute with', 'error');
      return;
    }
    this.creating = true;
    this.disputeService.create(this.createForm).subscribe({
      next: () => {
        this.showAlert('Dispute created successfully', 'success');
        this.showCreateForm = false;
        this.createForm = { ...this.createForm, reason: '' };
        this.loadDisputes();
        this.creating = false;
      },
      error: () => {
        this.showAlert('Error creating dispute', 'error');
        this.creating = false;
      }
    });
  }

  onOtherUserSelected(): void {
    if (this.selectedOtherUserId == null) return;
    this.setContractFromOtherUser(this.selectedOtherUserId);
  }

  private setContractFromOtherUser(otherUserId: number): void {
    const conv = this.conversations.find(c => c.otherUserId === otherUserId);
    this.createForm.contractId = conv?.contractId ?? 0;
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
      case 'OPEN': return 'status-open';
      case 'IN_REVIEW': return 'status-review';
      case 'RESOLVED': return 'status-resolved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'Open';
      case 'IN_REVIEW': return 'In review';
      case 'RESOLVED': return 'Resolved';
      case 'REJECTED': return 'Rejected';
      default: return status || '-';
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
