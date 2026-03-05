import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DisputeService } from '../../front/services/dispute.service';
import { Dispute, DisputeStatus, UpdateDisputeRequest } from '../../front/models/communication';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-disputes.component.html',
  styleUrls: ['./admin-disputes.component.scss']
})
export class AdminDisputesComponent implements OnInit {
  loading = true;
  disputes: Dispute[] = [];
  filterContractId = '';
  filterStatus = '';
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  editingDispute: Dispute | null = null;
  editForm: UpdateDisputeRequest = { disputeType: 'QUALITY_ISSUE', reason: '' };
  updating = false;

  constructor(private readonly disputeService: DisputeService) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.loading = true;
    const contractId = this.filterContractId ? +this.filterContractId : undefined;
    const status = this.filterStatus ? (this.filterStatus as DisputeStatus) : undefined;

    this.disputeService.list(contractId, status).subscribe({
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

  startEdit(d: Dispute): void {
    this.editingDispute = d;
    this.editForm = { disputeType: d.disputeType, reason: d.reason };
  }

  cancelEdit(): void {
    this.editingDispute = null;
  }

  saveEdit(): void {
    if (!this.editingDispute || !this.editForm.reason?.trim()) return;
    this.updating = true;
    this.disputeService.adminUpdate(this.editingDispute.id, this.editForm).subscribe({
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
    this.disputeService.adminDelete(d.id).subscribe({
      next: () => {
        this.showAlert('Dispute deleted', 'success');
        this.loadDisputes();
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
