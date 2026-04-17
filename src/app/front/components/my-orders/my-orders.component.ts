import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { AuthService } from '../../services/auth.service';
import { ServicesService } from '../../services/services.service';

interface Order {
  id: number;
  orderNumber?: string;
  buyerId: number;
  sellerId: number;
  service: { 
    id: number; 
    title: string; 
    mediaUrls?: string; 
    deliveryDays: number;
    revisionCount?: number;
  };
  selectedAddOns?: string;
  totalPrice: number;
  status: 'PENDING_ACCEPTANCE' | 'PENDING_REQUIREMENTS' | 'IN_PROGRESS' | 'DELIVERED' | 'IN_REVISION' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  requirements?: string;
  buyerRequirementsAnswer?: string;
  deliveryMessage?: string;
  deliveryFileUrls?: string;
  revisionNotes?: string;
  revisionsUsed: number;
  maxRevisions?: number;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  deliveredAt?: string;
}

// Dialog for submitting requirements
@Component({
  selector: 'app-requirements-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="dialog-header">
      <h3>Submit Project Requirements</h3>
      <p>Please provide detailed requirements for the freelancer</p>
    </div>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Your Requirements</mat-label>
        <textarea matInput [(ngModel)]="requirements" rows="6" 
                  placeholder="Describe what you need in detail..."></textarea>
        <mat-hint>Minimum 20 characters</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button class="btn-submit" [disabled]="requirements.length < 20" [mat-dialog-close]="requirements">
        Submit Requirements
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { padding: 20px 20px 0; }
    .dialog-header h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
    .dialog-header p { margin: 0; color: #9ca3af; font-size: 13px; }
    mat-dialog-content { padding: 16px 20px; min-width: 400px; }
    .full-width { width: 100%; }
    .btn-submit {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 8px;
      padding: 10px 20px; font-weight: 600; cursor: pointer;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class RequirementsDialogComponent {
  requirements = '';
}

// Dialog for requesting revision
@Component({
  selector: 'app-revision-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="dialog-header">
      <h3>Request Revision</h3>
      <p>Describe what changes you need</p>
    </div>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Revision Notes</mat-label>
        <textarea matInput [(ngModel)]="notes" rows="5" 
                  placeholder="What needs to be changed?"></textarea>
        <mat-hint>Revisions remaining: {{ remainingRevisions }}</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button class="btn-submit" [disabled]="notes.length < 10" [mat-dialog-close]="notes">
        Request Revision
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { padding: 20px 20px 0; }
    .dialog-header h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
    .dialog-header p { margin: 0; color: #9ca3af; font-size: 13px; }
    mat-dialog-content { padding: 16px 20px; min-width: 400px; }
    .full-width { width: 100%; }
    .btn-submit {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 8px;
      padding: 10px 20px; font-weight: 600; cursor: pointer;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class RevisionDialogComponent {
  notes = '';
  remainingRevisions = 0;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatBadgeModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe
  ],
  styles: [`
    :host { display: block; padding: 20px; font-family: 'Segoe UI', system-ui, sans-serif; }

    .bc-card {
      background: #fff; border-radius: 12px; padding: 14px 20px;
      margin-bottom: 22px; border: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .bc-card h5 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
    .bc { list-style: none; display: flex; gap: 6px; margin: 0; padding: 0; font-size: 13px; color: #9ca3af; }
    .bc li a { color: #6366f1; text-decoration: none; }
    .bc li a:hover { text-decoration: underline; }
    .bc li:not(:first-child)::before { content: '/'; margin-right: 6px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 22px; }
    .stat-box {
      background: #fff; border-radius: 14px; padding: 20px 24px;
      border: 1px solid #f3f4f6; box-shadow: 0 1px 4px rgba(0,0,0,.05); text-align: center;
    }
    .stat-val { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .stat-lbl { font-size: 13px; color: #6b7280; }
    .stat-val.violet { color: #6366f1; }
    .stat-val.green  { color: #059669; }
    .stat-val.amber  { color: #d97706; }
    .stat-val.gray   { color: #374151; }

    .table-card {
      background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;
      overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.05);
    }

    ::ng-deep .orders-tabs .mat-mdc-tab-header {
      background: #f8f9fb !important; border-bottom: 1px solid #e5e7eb;
    }
    ::ng-deep .orders-tabs .mat-mdc-tab { color: #6b7280 !important; }
    ::ng-deep .orders-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color: #6366f1 !important; }
    ::ng-deep .orders-tabs .mdc-tab-indicator__content--underline { border-color: #6366f1 !important; }
    ::ng-deep .orders-tabs .mat-mdc-tab-body-wrapper { background: #fff !important; }

    .order-item {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 20px; border-bottom: 1px solid #f3f4f6;
      background: #fff; transition: background .12s;
    }
    .order-item:hover { background: #fafafa; }
    .order-item:last-child { border-bottom: none; }

    .svc-img {
      width: 100px; height: 70px; border-radius: 8px;
      object-fit: cover; flex-shrink: 0; background: #f3f4f6;
    }
    .svc-img-ph {
      width: 100px; height: 70px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg,#ede9fe,#ddd6fe);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: #8b5cf6;
    }

    .order-info { flex: 1; min-width: 0; }
    .order-title {
      font-size: 15px; font-weight: 600; color: #111827;
      margin: 0 0 8px; line-height: 1.4;
    }
    .order-meta {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      font-size: 12.5px; color: #9ca3af; margin-bottom: 6px;
    }

    .status-pill {
      display: inline-block; padding: 3px 10px;
      border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .s-pending   { background: #fef9c3; color: #854d0e; }
    .s-progress  { background: #dbeafe; color: #1e40af; }
    .s-delivered { background: #ede9fe; color: #6d28d9; }
    .s-revision  { background: #ffedd5; color: #9a3412; }
    .s-completed { background: #dcfce7; color: #166534; }
    .s-cancelled { background: #f3f4f6; color: #6b7280; }
    .s-disputed  { background: #fee2e2; color: #991b1b; }

    .prog-wrap { margin-top: 8px; }
    .prog-track { height: 5px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .prog-fill  { height: 100%; background: #6366f1; border-radius: 4px; transition: width .3s; }
    .prog-lbl   { font-size: 11px; color: #9ca3af; margin-top: 3px; }

    .order-right { text-align: right; flex-shrink: 0; min-width: 140px; }
    .order-price { font-size: 18px; font-weight: 700; color: #6366f1; margin-bottom: 10px; }
    .btn-action {
      background: #ede9fe; color: #6d28d9; border: none; border-radius: 8px;
      padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
      transition: background .15s; white-space: nowrap; margin-bottom: 6px;
      width: 100%;
    }
    .btn-action:hover { background: #ddd6fe; }
    .btn-action.success { background: #dcfce7; color: #166534; }
    .btn-action.success:hover { background: #bbf7d0; }
    .btn-action.warn { background: #fef3c7; color: #d97706; }
    .btn-action.warn:hover { background: #fde68a; }
    .btn-cancel {
      background: #fee2e2; color: #dc2626; border: none; border-radius: 8px;
      padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
      width: 100%; transition: background .15s;
    }
    .btn-cancel:hover { background: #fecaca; }

    .delivery-message {
      background: #f0fdf4; border-radius: 8px; padding: 10px 12px;
      margin-top: 8px; font-size: 12.5px; color: #166534;
    }

    .empty-state {
      text-align: center; padding: 60px 20px; color: #9ca3af;
    }
    .empty-state i { font-size: 44px; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 14px; margin: 0 0 18px; }
    .btn-browse {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 10px;
      padding: 11px 24px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .2s;
    }
    .btn-browse:hover { opacity: .9; }

    .loading-wrap { display: flex; justify-content: center; padding: 50px; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .order-item { flex-wrap: wrap; }
      .order-right { width: 100%; margin-top: 12px; }
    }
  `],
  template: `
    <div class="orders-wrap">

      <!-- Breadcrumb -->
      <div class="bc-card">
        <h5>My Orders</h5>
        <ol class="bc">
          <li><a routerLink="/front">Home</a></li>
          <li>My Orders</li>
        </ol>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-val violet">{{ activeOrdersCount }}</div>
          <div class="stat-lbl">Active Orders</div>
        </div>
        <div class="stat-box">
          <div class="stat-val green">{{ completedCount }}</div>
          <div class="stat-lbl">Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-val amber">{{ pendingCount }}</div>
          <div class="stat-lbl">Pending Action</div>
        </div>
        <div class="stat-box">
          <div class="stat-val gray">\${{ totalSpent | number:'1.2-2' }}</div>
          <div class="stat-lbl">Total Spent</div>
        </div>
      </div>

      <!-- View Toggle -->
      <div style="margin-bottom: 16px; display: flex; gap: 10px;">
        <button class="btn-action" style="width: auto; padding: 8px 20px;"
                [class.success]="viewMode === 'buyer'"
                (click)="viewMode = 'buyer'; loadOrders()">
          <i class="ri-shopping-bag-line"></i> Orders I've Placed
        </button>
        <button class="btn-action" style="width: auto; padding: 8px 20px;"
                [class.success]="viewMode === 'seller'"
                (click)="viewMode = 'seller'; loadOrders()">
          <i class="ri-store-3-line"></i> Orders I've Received
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="44"></mat-spinner>
      </div>

      <!-- Orders table card -->
      <div class="table-card" *ngIf="!loading">
        <mat-tab-group class="orders-tabs" animationDuration="0ms" (selectedIndexChange)="onTabChange($event)">

          <!-- All Orders -->
          <mat-tab label="All Orders">
            <ng-container *ngTemplateOutlet="orderList; context:{ orders: filteredOrders }"></ng-container>
          </mat-tab>

          <!-- Active -->
          <mat-tab label="Active">
            <ng-container *ngTemplateOutlet="orderList; context:{ orders: filteredOrders }"></ng-container>
          </mat-tab>

          <!-- Pending Action -->
          <mat-tab label="Needs Action">
            <ng-container *ngTemplateOutlet="orderList; context:{ orders: filteredOrders }"></ng-container>
          </mat-tab>

          <!-- Completed -->
          <mat-tab label="Completed">
            <ng-container *ngTemplateOutlet="orderList; context:{ orders: filteredOrders }"></ng-container>
          </mat-tab>

        </mat-tab-group>
      </div>

    </div>

    <!-- Order List Template -->
    <ng-template #orderList let-orders="orders">
      <div *ngIf="orders.length === 0" class="empty-state">
        <i class="ri-shopping-bag-line"></i>
        <p>No orders found</p>
        <button class="btn-browse" routerLink="/front/services">Browse Services</button>
      </div>

      <div *ngFor="let o of orders" class="order-item">

        <!-- Image -->
        <div class="svc-img-ph" *ngIf="!getServiceImage(o)">
          <i class="ri-image-line"></i>
        </div>
        <img *ngIf="getServiceImage(o)" [src]="getServiceImage(o)" class="svc-img" alt="service">

        <!-- Info -->
        <div class="order-info">
          <p class="order-title">{{ o.service?.title ?? 'Service #' + o.id }}</p>
          
          <div class="order-meta">
            <span class="status-pill" [ngClass]="statusClass(o.status)">{{ formatStatus(o.status) }}</span>
            <span>Order #{{ o.orderNumber || o.id }}</span>
            <span>{{ o.createdAt | date:'mediumDate' }}</span>
            <span *ngIf="viewMode === 'buyer'">Seller: Shop #{{ o.sellerId }}</span>
            <span *ngIf="viewMode === 'seller'">Buyer: User #{{ o.buyerId }}</span>
          </div>

          <!-- Requirements Status -->
          <div class="order-meta" *ngIf="o.status === 'PENDING_REQUIREMENTS'">
            <i class="ri-file-list-line" style="color:#d97706"></i>
            <span style="color:#d97706">Waiting for your requirements</span>
          </div>

          <!-- Progress -->
          <div class="prog-wrap" *ngIf="o.status === 'IN_PROGRESS'">
            <div class="prog-track">
              <div class="prog-fill" [style.width.%]="getProgress(o)"></div>
            </div>
            <p class="prog-lbl">
              Revisions used: {{ o.revisionsUsed || 0 }}/{{ o.maxRevisions || o.service?.revisionCount || 0 }}
            </p>
          </div>

          <!-- Delivery Message -->
          <div class="delivery-message" *ngIf="o.status === 'DELIVERED' && o.deliveryMessage">
            <i class="ri-mail-check-line" style="margin-right:6px"></i>
            {{ o.deliveryMessage }}
          </div>

          <!-- Revision Notes -->
          <div class="order-meta" *ngIf="o.status === 'IN_REVISION' && o.revisionNotes">
            <i class="ri-edit-line" style="color:#d97706"></i>
            <span style="color:#d97706">Revision requested: {{ o.revisionNotes | slice:0:50 }}...</span>
          </div>
        </div>

        <!-- Right Actions -->
        <div class="order-right">
          <p class="order-price">\${{ o.totalPrice | number:'1.2-2' }}</p>

          <!-- Buyer Actions -->
          
        <ng-container *ngIf="viewMode === 'buyer'">
            <button class="btn-action" *ngIf="o.status === 'PENDING_REQUIREMENTS'" 
                 (click)="openRequirementsDialog(o)">
                  Submit Requirements
            </button>
            <button class="btn-action success" *ngIf="o.status === 'DELIVERED'" 
               (click)="completeOrder(o)">
               Accept & Complete
             </button>
            <button class="btn-action warn" *ngIf="o.status === 'DELIVERED' && (o.revisionsUsed || 0) < (o.maxRevisions || o.service?.revisionCount || 0)" 
               (click)="openRevisionDialog(o)">
                Request Revision
             </button>
            <button class="btn-cancel" *ngIf="canCancel(o.status)" (click)="cancelOrder(o)">
                Cancel Order
            </button>
        </ng-container>

          <!-- Seller Actions -->
          <ng-container *ngIf="viewMode === 'seller'">
            <button class="btn-action" *ngIf="o.status === 'IN_PROGRESS'" 
                    (click)="deliverOrder(o)">
              Deliver Work
            </button>
            <button class="btn-action warn" *ngIf="o.status === 'IN_REVISION'" 
                    (click)="deliverOrder(o)">
              Deliver Revision
            </button>
          </ng-container>

          <!-- View Details -->
          <button class="btn-action" style="margin-top:6px; background:#f3f4f6; color:#374151"
                  (click)="viewOrderDetails(o)">
            View Details
          </button>
        </div>

      </div>
    </ng-template>
  `
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  activeTab = 0;
  loading = true;
  viewMode: 'buyer' | 'seller' = 'buyer';

  private readonly BASE = 'http://localhost:8085/microservice-service/api';

  constructor(
    public themeService: CustomizerSettingsService,
    private authService: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  loadOrders(): void {
    this.loading = true;
    const endpoint = this.viewMode === 'buyer' ? '/my-orders' : '/my-sales';
    
    this.http.get<Order[]>(this.BASE + '/orders' + endpoint, { headers: this.headers() }).subscribe({
      next: (list) => {
        this.orders = list.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.filterOrders();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.filterOrders();
  }

  filterOrders(): void {
    const filters: Record<number, (o: Order) => boolean> = {
      0: () => true, // All
      1: (o) => ['IN_PROGRESS', 'DELIVERED', 'IN_REVISION'].includes(o.status),
      2: (o) => this.needsAction(o),
      3: (o) => o.status === 'COMPLETED'
    };
    this.filteredOrders = this.orders.filter(filters[this.activeTab] || (() => true));
  }

  needsAction(o: Order): boolean {
    if (this.viewMode === 'buyer') {
      return ['PENDING_REQUIREMENTS', 'DELIVERED'].includes(o.status);
    } else {
      return ['PENDING_REQUIREMENTS', 'IN_PROGRESS', 'IN_REVISION'].includes(o.status);
    }
  }

  get activeOrdersCount(): number {
    return this.orders.filter(o => ['IN_PROGRESS', 'DELIVERED', 'IN_REVISION'].includes(o.status)).length;
  }

  get completedCount(): number {
    return this.orders.filter(o => o.status === 'COMPLETED').length;
  }

  get pendingCount(): number {
    return this.orders.filter(o => this.needsAction(o)).length;
  }

  get totalSpent(): number {
    return this.orders
      .filter(o => o.status === 'COMPLETED' && this.viewMode === 'buyer')
      .reduce((s, o) => s + o.totalPrice, 0);
  }

  getServiceImage(o: Order): string {
    if (!o.service?.mediaUrls) return '';
    return o.service.mediaUrls.split(',')[0].trim();
  }

  getProgress(o: Order): number {
    if (o.status === 'COMPLETED') return 100;
    if (o.status === 'DELIVERED') return 80;
    if (o.status === 'IN_PROGRESS') return 40;
    return 20;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      PENDING_ACCEPTANCE: 's-pending',
      PENDING_REQUIREMENTS: 's-pending',
      IN_PROGRESS: 's-progress',
      DELIVERED: 's-delivered',
      IN_REVISION: 's-revision',
      COMPLETED: 's-completed',
      CANCELLED: 's-cancelled',
      DISPUTED: 's-disputed'
    };
    return map[s] ?? 's-cancelled';
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  canCancel(status: string): boolean {
    return ['PENDING_ACCEPTANCE', 'PENDING_REQUIREMENTS', 'IN_PROGRESS'].includes(status);
  }

  openRequirementsDialog(order: Order): void {
    const ref = this.dialog.open(RequirementsDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe((requirements: string) => {
      if (!requirements?.trim()) return;
      
      this.http.patch(`${this.BASE}/orders/${order.id}/requirements`, 
        { requirementsAnswer: requirements }, 
        { headers: this.headers() }
      ).subscribe({
        next: (updated: any) => {
          order.status = updated.status;
          order.buyerRequirementsAnswer = requirements;
          this.filterOrders();
          this.snackBar.open('Requirements submitted!', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to submit requirements', 'Close', { duration: 3000 })
      });
    });
  }

  openRevisionDialog(order: Order): void {
    const ref = this.dialog.open(RevisionDialogComponent, { width: '500px' });
    const remaining = (order.maxRevisions || order.service?.revisionCount || 0) - (order.revisionsUsed || 0);
    ref.componentInstance.remainingRevisions = remaining;
    
    ref.afterClosed().subscribe((notes: string) => {
      if (!notes?.trim()) return;
      
      this.http.patch(`${this.BASE}/orders/${order.id}/revision`, 
        { revisionNotes: notes }, 
        { headers: this.headers() }
      ).subscribe({
        next: (updated: any) => {
          order.status = updated.status;
          order.revisionNotes = notes;
          order.revisionsUsed = (order.revisionsUsed || 0) + 1;
          this.filterOrders();
          this.snackBar.open('Revision requested!', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to request revision', 'Close', { duration: 3000 })
      });
    });
  }

  deliverOrder(order: Order): void {
    const message = prompt('Enter delivery message (optional):');
    
    this.http.patch(`${this.BASE}/orders/${order.id}/deliver`, 
      { deliveryMessage: message || 'Work delivered!' }, 
      { headers: this.headers() }
    ).subscribe({
      next: (updated: any) => {
        order.status = updated.status;
        order.deliveryMessage = message || 'Work delivered!';
        this.filterOrders();
        this.snackBar.open('Work delivered!', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to deliver work', 'Close', { duration: 3000 })
    });
  }

  completeOrder(order: Order): void {
    if (!confirm('Accept delivery and complete this order?')) return;
    
    this.http.patch(`${this.BASE}/orders/${order.id}/complete`, {}, { headers: this.headers() }).subscribe({
      next: () => {
        order.status = 'COMPLETED';
        this.filterOrders();
        this.snackBar.open('Order completed!', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to complete order', 'Close', { duration: 3000 })
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm('Cancel this order?')) return;
    
    this.http.patch(`${this.BASE}/orders/${order.id}/cancel`, {}, { headers: this.headers() }).subscribe({
      next: () => {
        order.status = 'CANCELLED';
        this.filterOrders();
        this.snackBar.open('Order cancelled', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to cancel order', 'Close', { duration: 3000 })
    });
  }

  viewOrderDetails(order: Order): void {
    this.router.navigate(['/front/orders', order.id]);
  }
}