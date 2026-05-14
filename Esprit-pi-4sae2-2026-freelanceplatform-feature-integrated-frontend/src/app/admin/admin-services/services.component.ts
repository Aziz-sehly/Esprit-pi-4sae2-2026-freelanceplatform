// admin/admin-services/admin-services.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FreelancerService, ServicesService } from '../../front/services/services.service';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrap">

      <div class="page-header">
        <div>
          <h1 class="page-title">Service Approvals</h1>
          <p class="page-subtitle">
            {{ services.length }} service(s) total
            <span *ngIf="filterStatus">&nbsp;&middot; <strong>{{ filterStatus | titlecase }}</strong></span>
          </p>
        </div>
        <button class="btn-refresh" (click)="load()">&#8635; Refresh</button>
      </div>

      <div *ngIf="alertMessage" class="alert-bar"
           [class.alert-success]="alertType === 'success'"
           [class.alert-error]="alertType === 'error'">
        {{ alertMessage }}
      </div>

      <div class="stats-row" *ngIf="!loading">
        <div class="stat-card stat-pending">
          <div class="stat-value">{{ countByStatus('SUBMITTED') }}</div>
          <div class="stat-label">Pending Review</div>
        </div>
        <div class="stat-card stat-active">
          <div class="stat-value">{{ countByStatus('ACTIVE') }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card stat-rejected">
          <div class="stat-value">{{ countByStatus('REJECTED') }}</div>
          <div class="stat-label">Rejected</div>
        </div>
        <div class="stat-card stat-draft">
          <div class="stat-value">{{ countByStatus('DRAFT') }}</div>
          <div class="stat-label">Draft</div>
        </div>
      </div>

      <div class="filter-bar">
        <button class="filter-chip" [class.active]="filterStatus === ''"
                (click)="setFilter('')">All ({{ services.length }})</button>
        <button class="filter-chip" [class.active]="filterStatus === 'SUBMITTED'"
                (click)="setFilter('SUBMITTED')">Pending ({{ countByStatus('SUBMITTED') }})</button>
        <button class="filter-chip" [class.active]="filterStatus === 'ACTIVE'"
                (click)="setFilter('ACTIVE')">Active ({{ countByStatus('ACTIVE') }})</button>
        <button class="filter-chip" [class.active]="filterStatus === 'REJECTED'"
                (click)="setFilter('REJECTED')">Rejected ({{ countByStatus('REJECTED') }})</button>
        <button class="filter-chip" [class.active]="filterStatus === 'DRAFT'"
                (click)="setFilter('DRAFT')">Draft ({{ countByStatus('DRAFT') }})</button>
      </div>

      <div *ngIf="loading" class="skeleton-table">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
          <div class="skeleton-cell wide"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-backdrop" *ngIf="rejectTargetId !== null" (click)="cancelReject()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reject Service</h3>
            <button class="modal-close" (click)="cancelReject()">&#10005;</button>
          </div>
          <p class="modal-desc">Provide feedback so the freelancer can improve their listing.</p>
          <textarea class="modal-textarea" [(ngModel)]="rejectReason"
                    placeholder="e.g. Images are low quality, description is too short..."
                    rows="4"></textarea>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cancelReject()">Cancel</button>
            <button class="btn-confirm-reject" [disabled]="!rejectReason.trim()"
                    (click)="confirmReject()">Reject Service</button>
          </div>
        </div>
      </div>

      <div class="data-table" *ngIf="!loading">
        <div class="table-header">
          <div class="th">SERVICE</div>
          <div class="th">CATEGORY</div>
          <div class="th">PRICE</div>
          <div class="th">DELIVERY</div>
          <div class="th">STATUS</div>
          <div class="th">SUBMITTED</div>
          <div class="th">ACTIONS</div>
        </div>

        <div class="table-row" *ngFor="let s of filtered">
          <div class="td">
            <div class="service-info">
              <span class="service-title" [title]="s.title">{{ truncate(s.title, 34) }}</span>
              <span class="service-meta">Shop #{{ s.shopId }}</span>
            </div>
          </div>
          <div class="td"><span class="cat-tag">{{ s.category }}</span></div>
          <div class="td"><span class="price-val">{{ formatPrice(s.price) }}</span></div>
          <div class="td"><span class="delivery-val">{{ s.deliveryTimeDays ?? s.deliveryDays }}d</span></div>
          <div class="td">
            <span class="status-pill" [ngClass]="statusClass(s.status)">{{ formatStatus(s.status) }}</span>
          </div>
          <div class="td"><span class="date-val">{{ formatDate(s.createdAt) }}</span></div>
          <div class="td actions-cell">
            <ng-container *ngIf="s.status === 'SUBMITTED'">
              <button class="action-btn approve" (click)="approve(s)">Approve</button>
              <button class="action-btn reject" (click)="openReject(s.id)">Reject</button>
            </ng-container>
            <ng-container *ngIf="s.status === 'ACTIVE'">
              <button class="action-btn reject" (click)="openReject(s.id)">Revoke</button>
            </ng-container>
            <ng-container *ngIf="s.status === 'REJECTED'">
              <button class="action-btn approve" (click)="approve(s)">Re-approve</button>
            </ng-container>
            <span *ngIf="s.status === 'DRAFT' || s.status === 'PAUSED' || s.status === 'ARCHIVED'"
                  class="no-action">—</span>
          </div>
        </div>

        <div class="table-empty" *ngIf="filtered.length === 0">
          <p>No services match this filter.</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-wrap { font-family: 'DM Sans', sans-serif; padding: 28px 32px; max-width: 1280px; margin: 0 auto; color: #1f2937; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title  { margin: 0 0 4px; font-size: 26px; font-weight: 700; color: #111827; }
    .page-subtitle { margin: 0; font-size: 14px; color: #6b7280; }

    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all .15s; }
    .btn-refresh:hover { border-color: #6366f1; color: #6366f1; }

    .alert-bar { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; font-weight: 500; }
    .alert-bar.alert-success { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
    .alert-bar.alert-error   { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 14px; padding: 18px 22px; border: 1px solid #f3f4f6; box-shadow: 0 1px 4px rgba(0,0,0,.05); transition: transform .15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-value { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
    .stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
    .stat-pending  .stat-value { color: #d97706; }
    .stat-active   .stat-value { color: #059669; }
    .stat-rejected .stat-value { color: #dc2626; }
    .stat-draft    .stat-value { color: #6b7280; }

    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .filter-chip { padding: 7px 16px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
    .filter-chip:hover { border-color: #6366f1; color: #6366f1; }
    .filter-chip.active { background: #6366f1; color: white; border-color: #6366f1; }

    .skeleton-table { display: flex; flex-direction: column; gap: 2px; }
    .skeleton-row { display: flex; gap: 12px; padding: 16px 20px; background: white; border-radius: 8px; }
    .skeleton-cell { height: 16px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 400% 100%; border-radius: 6px; animation: shimmer 1.4s infinite; flex: 1; }
    .skeleton-cell.wide { flex: 2; }
    .skeleton-cell.narrow { flex: 0.5; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: white; border-radius: 18px; padding: 28px 32px; width: 480px; max-width: 95vw; box-shadow: 0 24px 64px rgba(0,0,0,.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; }
    .modal-close { background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; }
    .modal-desc { margin: 0 0 16px; font-size: 14px; color: #6b7280; }
    .modal-textarea { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; }
    .modal-textarea:focus { border-color: #6366f1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    .btn-cancel { padding: 9px 20px; background: white; border: 1.5px solid #e5e7eb; border-radius: 9px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
    .btn-confirm-reject { padding: 9px 20px; background: #ef4444; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; color: white; cursor: pointer; }
    .btn-confirm-reject:disabled { opacity: .4; cursor: not-allowed; }
    .btn-confirm-reject:hover:not(:disabled) { background: #dc2626; }

    .data-table { background: white; border-radius: 18px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .table-header, .table-row { display: grid; grid-template-columns: 2.2fr 1fr 80px 90px 130px 110px 190px; gap: 8px; padding: 14px 20px; align-items: center; }
    .table-header { background: #f8f9fb; border-bottom: 1px solid #e5e7eb; }
    .th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #6b7280; }
    .table-row { border-top: 1px solid #f3f4f6; transition: background .12s; }
    .table-row:hover { background: #fafafa; }
    .td { font-size: 14px; }

    .service-info { display: flex; flex-direction: column; gap: 2px; }
    .service-title { font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .service-meta { font-size: 12px; color: #9ca3af; }

    .cat-tag { display: inline-block; padding: 3px 10px; background: #ede9fe; color: #6d28d9; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .price-val    { font-weight: 700; color: #059669; font-size: 15px; }
    .delivery-val { font-size: 13px; color: #6b7280; }
    .date-val     { font-size: 13px; color: #9ca3af; }

    .status-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .s-active    { background: #dcfce7; color: #166534; }
    .s-submitted { background: #fef9c3; color: #854d0e; }
    .s-draft     { background: #f3f4f6; color: #374151; }
    .s-rejected  { background: #fee2e2; color: #991b1b; }
    .s-paused    { background: #e0f2fe; color: #075985; }
    .s-archived  { background: #f3f4f6; color: #6b7280; }

    .actions-cell { display: flex; gap: 6px; }
    .action-btn { padding: 6px 14px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .action-btn.approve { background: #10b981; color: white; }
    .action-btn.approve:hover { background: #059669; }
    .action-btn.reject  { background: #ef4444; color: white; }
    .action-btn.reject:hover  { background: #dc2626; }
    .no-action { color: #d1d5db; }

    .table-empty { padding: 60px; text-align: center; color: #9ca3af; font-style: italic; }

    @media (max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .admin-wrap { padding: 16px; }
    }
  `]
})
export class AdminServicesComponent implements OnInit {
  services: FreelancerService[] = [];
  filtered: FreelancerService[] = [];
  loading = true;
  filterStatus = 'SUBMITTED';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  rejectTargetId: number | null = null;
  rejectReason = '';

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const all: FreelancerService[] = [];
    let done = 0;
    const merge = (list: FreelancerService[]) => {
      all.push(...list);
      done++;
      if (done === 2) {
        const map = new Map<number, FreelancerService>();
        all.forEach(s => map.set(s.id, s));
        this.services = Array.from(map.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.applyFilter();
        this.loading = false;
      }
    };
    this.servicesService.getPendingServices().subscribe({ next: merge, error: () => { done++; if (done === 2) this.loading = false; } });
    this.servicesService.getActiveServices().subscribe({ next: merge, error: () => { done++; if (done === 2) this.loading = false; } });
  }

  setFilter(status: string): void { this.filterStatus = status; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.services.filter(s => s.status === this.filterStatus)
      : [...this.services];
  }

  approve(s: FreelancerService): void {
    this.servicesService.approveService(s.id).subscribe({
      next: (updated) => { s.status = updated.status; this.applyFilter(); this.showAlert(s.title + ' approved.', 'success'); },
      error: () => this.showAlert('Failed to approve service.', 'error')
    });
  }

  openReject(id: number): void { this.rejectTargetId = id; this.rejectReason = ''; }
  cancelReject(): void { this.rejectTargetId = null; this.rejectReason = ''; }

  confirmReject(): void {
    if (this.rejectTargetId === null || !this.rejectReason.trim()) return;
    this.servicesService.rejectService(this.rejectTargetId, this.rejectReason).subscribe({
      next: (updated) => {
        const s = this.services.find(x => x.id === updated.id);
        if (s) s.status = updated.status;
        this.applyFilter(); this.cancelReject(); this.showAlert('Service rejected.', 'success');
      },
      error: () => { this.cancelReject(); this.showAlert('Failed to reject service.', 'error'); }
    });
  }

  countByStatus(status: string): number { return this.services.filter(s => s.status === status).length; }

  statusClass(s: string): string {
    const map: Record<string, string> = { ACTIVE: 's-active', SUBMITTED: 's-submitted', DRAFT: 's-draft', REJECTED: 's-rejected', PAUSED: 's-paused', ARCHIVED: 's-archived' };
    return map[s] || 's-draft';
  }

  formatStatus(s: string): string {
    if (s === 'SUBMITTED') return 'Pending';
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  }

  // Dollar sign built in TS — avoids ${{ }} in template strings
  formatPrice(price: number): string { return '$' + price; }

  truncate(val: string, limit: number): string {
    if (!val) return '';
    return val.length > limit ? val.substring(0, limit) + '…' : val;
  }

  private showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg; this.alertType = type;
    setTimeout(() => { this.alertMessage = ''; }, 4000);
  }
}