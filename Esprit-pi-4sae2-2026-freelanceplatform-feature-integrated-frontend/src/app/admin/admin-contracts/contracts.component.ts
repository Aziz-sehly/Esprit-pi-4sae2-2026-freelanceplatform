// admin/admin-contracts/admin-contracts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../front/services/auth.service';

export interface AdminContract {
  id: number;
  clientId: number;
  freelancerId: number;
  serviceId?: number;
  title: string;
  description?: string;
  amount: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrap">

      <div class="page-header">
        <div>
          <h1 class="page-title">All Contracts</h1>
          <p class="page-subtitle">{{ contracts.length }} contract(s) total</p>
        </div>
        <button class="btn-refresh" (click)="load()">&#8635; Refresh</button>
      </div>

      <div *ngIf="alertMessage" class="alert-bar"
           [class.alert-success]="alertType === 'success'"
           [class.alert-error]="alertType === 'error'">
        {{ alertMessage }}
      </div>

      <div class="stats-row" *ngIf="!loading">
        <div class="stat-card" *ngFor="let st of statuses" [ngClass]="'stat-' + st.toLowerCase()">
          <div class="stat-value">{{ countByStatus(st) }}</div>
          <div class="stat-label">{{ formatStatus(st) }}</div>
        </div>
      </div>

      <div class="filter-bar">
        <button class="filter-chip" [class.active]="filterStatus === ''"
                (click)="setFilter('')">All ({{ contracts.length }})</button>
        <button class="filter-chip" *ngFor="let st of statuses"
                [class.active]="filterStatus === st"
                (click)="setFilter(st)">
          {{ formatStatus(st) }} ({{ countByStatus(st) }})
        </button>
      </div>

      <div *ngIf="loading" class="skeleton-table">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
          <div class="skeleton-cell wide"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell narrow"></div>
          <div class="skeleton-cell narrow"></div>
        </div>
      </div>

      <div class="data-table" *ngIf="!loading">
        <div class="table-header">
          <div class="th">TITLE</div>
          <div class="th">CLIENT</div>
          <div class="th">FREELANCER</div>
          <div class="th">AMOUNT</div>
          <div class="th">STATUS</div>
          <div class="th">START</div>
          <div class="th">END</div>
          <div class="th">ACTIONS</div>
        </div>

        <div class="table-row" *ngFor="let c of filtered">
          <div class="td"><span class="contract-title" [title]="c.title">{{ truncate(c.title, 30) }}</span></div>
          <div class="td"><span class="id-badge client">C#{{ c.clientId }}</span></div>
          <div class="td"><span class="id-badge freelancer">F#{{ c.freelancerId }}</span></div>
          <div class="td"><span class="amount-val">{{ formatAmount(c.amount) }}</span></div>
          <div class="td">
            <span class="status-pill" [ngClass]="statusClass(c.status)">{{ formatStatus(c.status) }}</span>
          </div>
          <div class="td"><span class="date-val">{{ formatDate(c.startDate) }}</span></div>
          <div class="td"><span class="date-val">{{ formatDate(c.endDate) }}</span></div>
          <div class="td actions-cell">
            <button class="action-btn view" (click)="toggleDetail(c)">View</button>
            <button class="action-btn del"  (click)="deleteContract(c.id)">Delete</button>
          </div>
        </div>

        <div class="table-empty" *ngIf="filtered.length === 0">
          <p>No contracts match this filter.</p>
        </div>
      </div>

      <!-- Detail Panel -->
      <div class="detail-panel" *ngIf="selected">
        <div class="detail-panel-header">
          <h3>Contract #{{ selected.id }} — {{ selected.title }}</h3>
          <button class="close-btn" (click)="selected = null">&#10005;</button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-key">Status</span>
            <span class="status-pill" [ngClass]="statusClass(selected.status)">{{ formatStatus(selected.status) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Client ID</span>
            <span class="detail-val">#{{ selected.clientId }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Freelancer ID</span>
            <span class="detail-val">#{{ selected.freelancerId }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Amount</span>
            <span class="detail-val amount-val">{{ formatAmount(selected.amount) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Service ID</span>
            <span class="detail-val">{{ selected.serviceId ?? '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Start Date</span>
            <span class="detail-val">{{ formatDate(selected.startDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">End Date</span>
            <span class="detail-val">{{ formatDate(selected.endDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-key">Created</span>
            <span class="detail-val">{{ formatDate(selected.createdAt) }}</span>
          </div>
        </div>
        <div *ngIf="selected.description" class="detail-desc">
          <p class="detail-key">Description</p>
          <p class="desc-text">{{ selected.description }}</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-wrap { font-family: 'DM Sans', sans-serif; padding: 28px 32px; max-width: 1360px; margin: 0 auto; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title  { margin: 0 0 4px; font-size: 26px; font-weight: 700; color: #111827; }
    .page-subtitle { margin: 0; font-size: 14px; color: #6b7280; }

    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all .15s; }
    .btn-refresh:hover { border-color: #6366f1; color: #6366f1; }

    .alert-bar { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; font-weight: 500; }
    .alert-bar.alert-success { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
    .alert-bar.alert-error   { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }

    .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 14px; padding: 16px 20px; border: 1px solid #f3f4f6; box-shadow: 0 1px 4px rgba(0,0,0,.05); transition: transform .15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-value { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
    .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
    .stat-pending   .stat-value { color: #d97706; }
    .stat-active    .stat-value { color: #059669; }
    .stat-completed .stat-value { color: #1d4ed8; }
    .stat-cancelled .stat-value { color: #6b7280; }
    .stat-disputed  .stat-value { color: #dc2626; }

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

    .data-table { background: white; border-radius: 18px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .table-header, .table-row { display: grid; grid-template-columns: 1.8fr .7fr .9fr 100px 120px 100px 100px 140px; gap: 8px; padding: 13px 20px; align-items: center; }
    .table-header { background: #f8f9fb; border-bottom: 1px solid #e5e7eb; }
    .th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #6b7280; }
    .table-row { border-top: 1px solid #f3f4f6; transition: background .12s; }
    .table-row:hover { background: #fafafa; }
    .td { font-size: 14px; }

    .contract-title { font-weight: 600; color: #111827; }
    .id-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .id-badge.client     { background: #dbeafe; color: #1e40af; }
    .id-badge.freelancer { background: #ede9fe; color: #6d28d9; }
    .amount-val { font-weight: 700; color: #059669; font-size: 15px; }
    .date-val   { font-size: 12px; color: #9ca3af; }

    .status-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .s-pending   { background: #fef9c3; color: #854d0e; }
    .s-active    { background: #dcfce7; color: #166534; }
    .s-completed { background: #dbeafe; color: #1e40af; }
    .s-cancelled { background: #f3f4f6; color: #6b7280; }
    .s-disputed  { background: #fee2e2; color: #991b1b; }

    .actions-cell { display: flex; gap: 6px; }
    .action-btn { padding: 5px 12px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .action-btn.view { background: #dbeafe; color: #1e40af; }
    .action-btn.view:hover { background: #bfdbfe; }
    .action-btn.del  { background: #fee2e2; color: #991b1b; }
    .action-btn.del:hover  { background: #fecaca; }

    .table-empty { padding: 60px; text-align: center; color: #9ca3af; font-style: italic; }

    .detail-panel { margin-top: 20px; background: white; border-radius: 16px; border: 1.5px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .detail-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #f8f9fb; border-bottom: 1px solid #e5e7eb; }
    .detail-panel-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
    .close-btn { background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; }
    .close-btn:hover { color: #374151; }
    .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); padding: 20px 24px; gap: 0; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-key { font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: .4px; }
    .detail-val { font-size: 15px; font-weight: 600; color: #111827; }
    .detail-desc { padding: 0 24px 20px; }
    .desc-text { margin: 4px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6; }

    @media (max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .detail-grid { grid-template-columns: repeat(2, 1fr); }
      .admin-wrap { padding: 16px; }
    }
  `]
})
export class AdminContractsComponent implements OnInit {
  contracts: AdminContract[] = [];
  filtered: AdminContract[] = [];
  loading = true;
  filterStatus = '';
  selected: AdminContract | null = null;
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  statuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

  private readonly BASE = 'http://localhost:8085/microservice-contract/api/contracts';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void { this.load(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  load(): void {
    this.loading = true;
    this.http.get<AdminContract[]>(this.BASE, { headers: this.headers() }).subscribe({
      next: (list) => {
        this.contracts = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load contracts:', err);
        this.showAlert('Could not load contracts.', 'error');
        this.loading = false;
      }
    });
  }

  setFilter(status: string): void { this.filterStatus = status; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.contracts.filter(c => c.status === this.filterStatus)
      : [...this.contracts];
  }

  toggleDetail(c: AdminContract): void {
    this.selected = this.selected?.id === c.id ? null : c;
  }

  deleteContract(id: number): void {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    this.http.delete(this.BASE + '/' + id, { headers: this.headers() }).subscribe({
      next: () => {
        this.contracts = this.contracts.filter(c => c.id !== id);
        if (this.selected?.id === id) this.selected = null;
        this.applyFilter();
        this.showAlert('Contract deleted.', 'success');
      },
      error: () => this.showAlert('Failed to delete contract.', 'error')
    });
  }

  countByStatus(status: string): number { return this.contracts.filter(c => c.status === status).length; }

  statusClass(s: string): string {
    const map: Record<string, string> = { PENDING: 's-pending', ACTIVE: 's-active', COMPLETED: 's-completed', CANCELLED: 's-cancelled', DISPUTED: 's-disputed' };
    return map[s] || '';
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  }

  // Dollar sign built in TS — avoids ${{ }} in template strings
  formatAmount(amount: number): string { return '$' + amount.toFixed(2); }

  truncate(val: string, limit: number): string {
    return val?.length > limit ? val.substring(0, limit) + '…' : (val ?? '');
  }

  private showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg; this.alertType = type;
    setTimeout(() => { this.alertMessage = ''; }, 4000);
  }
}