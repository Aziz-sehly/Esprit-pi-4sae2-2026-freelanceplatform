import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Shop, FreelancerService, ServicesService, CreateShopRequest } from '../../services/services.service';
import { AuthService } from '../../services/auth.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

// ── Shop Form Dialog ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-shop-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
            MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="dlg-header">
      <div class="dlg-icon"><i class="ri-store-3-line"></i></div>
      <h3>{{data?.id ? 'Edit Shop' : 'Create Your Shop'}}</h3>
      <p>{{data?.id ? 'Update your shop details' : 'Set up your shop to start selling services'}}</p>
    </div>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Shop Name *</mat-label>
        <input matInput [(ngModel)]="form.shopName" maxlength="100" placeholder="e.g. Creative Design Studio">
        <mat-hint align="end">{{form.shopName?.length || 0}}/100</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-100 mt-12">
        <mat-label>Tagline</mat-label>
        <input matInput [(ngModel)]="form.tagline" maxlength="120" placeholder="e.g. Turning ideas into reality">
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-100 mt-12">
        <mat-label>Description *</mat-label>
        <textarea matInput [(ngModel)]="form.description" rows="4" maxlength="500"
                  placeholder="Describe your expertise and what clients can expect..."></textarea>
        <mat-hint align="end">{{form.description?.length || 0}}/500</mat-hint>
      </mat-form-field>
      <div class="dlg-row mt-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Avatar / Logo URL</mat-label>
          <input matInput [(ngModel)]="form.avatarUrl" placeholder="https://...">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Banner URL</mat-label>
          <input matInput [(ngModel)]="form.bannerUrl" placeholder="https://...">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="dlg-cancel">Cancel</button>
      <button class="dlg-save" [disabled]="!form.shopName || !form.description || loading" (click)="save()">
        <mat-spinner diameter="16" *ngIf="loading" style="display:inline-block;margin-right:6px;"></mat-spinner>
        {{data?.id ? 'Save Changes' : 'Create Shop'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-header { background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 24px 22px;text-align:center;color:white; }
    .dlg-icon { width:56px;height:56px;background:rgba(255,255,255,.15);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px; i{font-size:26px;} }
    .dlg-header h3 { margin:0 0 6px;font-size:20px;font-weight:700; }
    .dlg-header p  { margin:0;opacity:.8;font-size:14px; }
    mat-dialog-content { padding:20px 24px 8px !important;max-height:55vh; }
    .mt-12 { margin-top:12px; }
    .dlg-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    mat-dialog-actions { padding:12px 24px 20px !important;gap:10px; }
    .dlg-cancel { color:#6b7280;font-size:14px; }
    .dlg-save {
      background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;
      border-radius:9px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;
      display:flex;align-items:center;gap:6px;transition:opacity .2s;
      &:disabled{opacity:.5;cursor:not-allowed;}
      &:not(:disabled):hover{opacity:.9;}
    }
  `]
})
export class ShopFormDialogComponent implements OnInit {
  data: Shop | null = null;
  loading = false;

  form: CreateShopRequest = {
    shopName: '',
    tagline: '',
    description: '',
    avatarUrl: '',
    bannerUrl: ''
  };

  constructor(public dialogRef: MatDialogRef<ShopFormDialogComponent>) {}

  ngOnInit(): void {
    if (this.data) {
      this.form = {
        shopName:    this.data.shopName    || '',
        tagline:     this.data.tagline     || '',
        description: this.data.description || '',
        avatarUrl:   this.data.avatarUrl   || '',
        bannerUrl:   this.data.bannerUrl   || ''
      };
    }
  }

  save(): void { this.dialogRef.close(this.form); }
}

// ── Main Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-shop-management',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <!-- Breadcrumb -->
    <div class="page-top">
      <div>
        <h1 class="page-title">My Shop</h1>
        <nav class="breadcrumb-nav">
          <a routerLink="/front">Home</a>
          <i class="ri-arrow-right-s-line"></i>
          <span>My Shop</span>
        </nav>
      </div>
    </div>

    <!-- Loading -->
    <div class="center-loading" *ngIf="loadingShop">
      <mat-spinner diameter="44"></mat-spinner>
      <span>Loading your shop...</span>
    </div>

    <ng-container *ngIf="!loadingShop">

      <!-- ── No Shop ── -->
      <div class="empty-shop" *ngIf="!shop">
        <div class="empty-shop-inner">
          <div class="empty-icon-wrap">
            <i class="ri-store-3-line"></i>
          </div>
          <h2>You don't have a shop yet</h2>
          <p>Create your freelancer shop to start offering services and growing your income.</p>
          <div class="perks">
            <div class="perk"><i class="ri-service-line"></i><span>Unlimited services</span></div>
            <div class="perk"><i class="ri-shield-check-line"></i><span>Secure payments</span></div>
            <div class="perk"><i class="ri-global-line"></i><span>Global clients</span></div>
          </div>
          <button class="btn-create" (click)="openShopDialog()">
            <i class="ri-add-line"></i> Create My Shop
          </button>
        </div>
      </div>

      <!-- ── Has Shop ── -->
      <ng-container *ngIf="shop">

        <!-- Banner card -->
        <div class="shop-banner-card">
          <div class="shop-banner-bg" [style.background-image]="shop.bannerUrl ? 'url('+shop.bannerUrl+')' : ''"></div>
          <div class="shop-banner-content">
            <div class="shop-identity">
              <img *ngIf="shop.avatarUrl" [src]="shop.avatarUrl" class="shop-ava" (error)="onImgError($event)">
              <div class="shop-ava-ph" *ngIf="!shop.avatarUrl"><i class="ri-store-3-line"></i></div>
              <div>
                <h2>{{ shop.shopName }}</h2>
                <p *ngIf="shop.tagline" class="tagline">"{{shop.tagline}}"</p>
                <p *ngIf="shop.description" class="shop-desc">{{shop.description | slice:0:120}}{{shop.description!.length > 120 ? '...' : ''}}</p>
              </div>
            </div>
            <button class="btn-edit-shop" (click)="openShopDialog()">
              <i class="ri-edit-line"></i> Edit Shop
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-box" *ngFor="let st of stats">
            <div class="stat-icon" [ngClass]="st.color"><i [class]="st.icon"></i></div>
            <div>
              <div class="stat-num">{{st.value}}</div>
              <div class="stat-lbl">{{st.label}}</div>
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="services-card">
          <div class="services-header">
            <h3>My Services</h3>
            <a class="btn-add-service" [routerLink]="['/front/services/new']">
              <i class="ri-add-line"></i> Add Service
            </a>
          </div>

          <div class="center-loading small" *ngIf="loadingServices">
            <mat-spinner diameter="34"></mat-spinner>
          </div>

          <!-- Grid -->
          <<!-- Grid -->
<div class="svc-grid" *ngIf="!loadingServices && services.length > 0">
  <div class="svc-card" *ngFor="let s of services">
    
    <!-- IMAGE SECTION - THIS WAS MISSING -->
    <div class="svc-img-wrap">
      <img *ngIf="getFirstImage(s.mediaUrls)" 
           [src]="getFirstImage(s.mediaUrls)" 
           [alt]="s.title" 
           (error)="onSvcImgError($event)">
      <div *ngIf="!getFirstImage(s.mediaUrls)" class="svc-img-ph">
        <i class="ri-image-line"></i>
      </div>
      <span class="svc-status" [ngClass]="statusClass(s.status)">{{formatStatus(s.status)}}</span>
    </div>
    
    <!-- BODY SECTION -->
    <div class="svc-body">
      <div class="svc-category"><i class="ri-price-tag-3-line"></i>{{s.category}}</div>
      <h4 class="svc-title">{{s.title}}</h4>
      <p class="svc-desc">{{s.description | slice:0:75}}{{s.description && s.description.length > 75 ? '...' : ''}}</p>
      <div class="svc-footer">
        <div class="svc-meta">
          <span><i class="ri-time-line"></i>{{ s.deliveryTimeDays }}d</span>
          <span><i class="ri-refresh-line"></i>{{ s.revisionCount ?? 0 }} rev</span>
        </div>
        <span class="svc-price">{{ '$' + s.price }}</span>
      </div>
    </div>
    
    <!-- ACTIONS SECTION -->
    <div class="svc-actions">
      <a class="act-btn violet" [routerLink]="['/front/services', s.id, 'edit']" title="Edit"><i class="ri-edit-line"></i></a>
      <a class="act-btn blue"   [routerLink]="['/front/services', s.id, 'addons']" title="Add-ons"><i class="ri-add-circle-line"></i></a>
      <button class="act-btn green" *ngIf="s.status==='DRAFT'||s.status==='REJECTED'"
              (click)="submitForReview(s)" title="Submit for review"><i class="ri-send-plane-line"></i></button>
      <button class="act-btn amber" *ngIf="s.status==='ACTIVE'||s.status==='PAUSED'"
              (click)="togglePause(s)" [title]="s.status==='ACTIVE'?'Pause':'Activate'">
        <i [class]="s.status==='ACTIVE'?'ri-pause-line':'ri-play-line'"></i></button>
      <button class="act-btn red" (click)="deleteService(s)" title="Delete"><i class="ri-delete-bin-line"></i></button>
    </div>
  </div>
</div>

          <!-- Empty -->
          <div class="svc-empty" *ngIf="!loadingServices && services.length === 0">
            <i class="ri-stack-line"></i>
            <p>No services yet. Add your first one to get started.</p>
            <a class="btn-outline-violet" [routerLink]="['/front/services/new']">
              <i class="ri-add-line"></i> Create First Service
            </a>
          </div>
        </div>

      </ng-container>
    </ng-container>
  `,
  styles: [`
    .page-top { margin-bottom:28px; }
    .page-title { font-size:26px;font-weight:700;color:#111827;margin:0 0 6px; }
    .breadcrumb-nav { display:flex;align-items:center;gap:4px;font-size:13px;color:#9ca3af;
      a{color:#6366f1;text-decoration:none;&:hover{text-decoration:underline;}}
      i{font-size:15px;}}

    .center-loading { display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:80px 0;gap:14px;color:#6b7280;font-size:14px;
      &.small{padding:40px 0;}}

    .empty-shop { display:flex;justify-content:center;padding:20px 0; }
    .empty-shop-inner {
      background:white;border-radius:20px;padding:56px 40px;text-align:center;
      box-shadow:0 1px 3px rgba(0,0,0,.06),0 8px 32px rgba(0,0,0,.05);max-width:540px;width:100%;
      h2{font-size:24px;font-weight:700;color:#111827;margin:20px 0 10px;}
      p{color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6;}
    }
    .empty-icon-wrap {
      width:88px;height:88px;border-radius:50%;
      background:linear-gradient(135deg,#ede9fe,#ddd6fe);
      display:flex;align-items:center;justify-content:center;margin:0 auto;
      i{font-size:38px;color:#7c3aed;}
    }
    .perks { display:flex;justify-content:center;gap:28px;margin-bottom:32px; }
    .perk { display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;color:#6b7280;
      i{font-size:22px;color:#6366f1;}}
    .btn-create {
      background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;
      border-radius:12px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;
      display:inline-flex;align-items:center;gap:8px;
      box-shadow:0 4px 14px rgba(99,102,241,.35);transition:opacity .2s;
      &:hover{opacity:.9;} i{font-size:17px;}
    }

    .shop-banner-card {
      border-radius:16px;overflow:hidden;margin-bottom:22px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);position:relative;
    }
    .shop-banner-bg { position:absolute;inset:0;background-size:cover;background-position:center;opacity:.25; }
    .shop-banner-content { position:relative;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px; }
    .shop-identity { display:flex;align-items:center;gap:18px;flex:1; }
    .shop-ava {
      width:68px;height:68px;border-radius:50%;object-fit:cover;
      border:3px solid rgba(255,255,255,.4);flex-shrink:0;
    }
    /* FIX: placeholder when no avatar */
    .shop-ava-ph {
      width:68px;height:68px;border-radius:50%;flex-shrink:0;
      border:3px solid rgba(255,255,255,.3);
      background:rgba(255,255,255,.15);
      display:flex;align-items:center;justify-content:center;
      i{font-size:26px;color:rgba(255,255,255,.8);}
    }
    .shop-identity h2 { margin:0 0 4px;color:white;font-size:22px;font-weight:700; }
    .tagline { margin:0 0 4px;color:rgba(255,255,255,.8);font-size:13px;font-style:italic; }
    .shop-desc { margin:0;color:rgba(255,255,255,.7);font-size:13px; }
    .btn-edit-shop {
      background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);border-radius:10px;
      padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;
      display:flex;align-items:center;gap:7px;transition:background .2s;white-space:nowrap;
      &:hover{background:rgba(255,255,255,.25);}
    }

    .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px; }
    .stat-box {
      background:white;border-radius:14px;padding:18px 20px;
      display:flex;align-items:center;gap:14px;
      box-shadow:0 1px 3px rgba(0,0,0,.05),0 2px 8px rgba(0,0,0,.03);
    }
    .stat-icon {
      width:46px;height:46px;border-radius:12px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      i{font-size:21px;}
      &.v{background:#ede9fe;i{color:#7c3aed;}}
      &.g{background:#dcfce7;i{color:#16a34a;}}
      &.y{background:#fef9c3;i{color:#ca8a04;}}
      &.b{background:#dbeafe;i{color:#2563eb;}}
    }
    .stat-num { font-size:22px;font-weight:700;color:#111827;line-height:1; }
    .stat-lbl { font-size:12px;color:#6b7280;margin-top:3px; }

    .services-card {
      background:white;border-radius:16px;padding:24px;
      box-shadow:0 1px 3px rgba(0,0,0,.05),0 2px 8px rgba(0,0,0,.03);
    }
    .services-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;
      h3{margin:0;font-size:17px;font-weight:700;color:#111827;}}
    .btn-add-service {
      background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;
      border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;
      display:inline-flex;align-items:center;gap:6px;text-decoration:none;transition:opacity .2s;
      &:hover{opacity:.9;color:white;}
    }

    .svc-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px; }
    .svc-card {
      border:1px solid #f3f4f6;border-radius:13px;overflow:hidden;
      transition:box-shadow .2s,transform .2s;
      &:hover{box-shadow:0 8px 24px rgba(0,0,0,.09);transform:translateY(-2px);}
    }

    /* FIX: image wrapper with correct sizing — no position:absolute on img */
    .svc-img-wrap {
      position:relative;
      width:100%;
      height:150px;
      overflow:hidden;
      background:linear-gradient(135deg,#ede9fe,#ddd6fe);
    }
    .svc-img-wrap img {
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }
    /* FIX: placeholder that fills the wrapper */
    .svc-img-ph {
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(135deg,#ede9fe,#ddd6fe);
      i { font-size:38px; color:#8b5cf6; opacity:.6; }
    }

    .svc-status {
      position:absolute;top:8px;right:8px;padding:3px 9px;
      border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.3px;
      &.status-active      {background:#dcfce7;color:#166534;}
      &.status-draft       {background:#f3f4f6;color:#374151;}
      &.status-submitted   {background:#fef9c3;color:#854d0e;}
      &.status-under-review{background:#dbeafe;color:#1e40af;}
      &.status-rejected    {background:#fee2e2;color:#991b1b;}
      &.status-paused      {background:#e0f2fe;color:#075985;}
      &.status-archived    {background:#f3f4f6;color:#6b7280;}
    }
    .svc-body { padding:14px; }
    .svc-category { font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px;margin-bottom:6px; }
    .svc-title { margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;line-height:1.4; }
    .svc-desc { margin:0 0 12px;font-size:12px;color:#6b7280;line-height:1.5; }
    .svc-footer { display:flex;align-items:center;justify-content:space-between; }
    .svc-meta { display:flex;gap:12px;font-size:12px;color:#9ca3af;
      span{display:flex;align-items:center;gap:3px;}}
    .svc-price { font-size:16px;font-weight:700;color:#6366f1; }
    .svc-actions { padding:10px 14px;border-top:1px solid #f3f4f6;display:flex;gap:7px; }
    .act-btn {
      width:32px;height:32px;border-radius:8px;border:none;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;cursor:pointer;transition:all .15s;text-decoration:none;
      &.violet{background:#ede9fe;color:#7c3aed;&:hover{background:#ddd6fe;}}
      &.blue  {background:#dbeafe;color:#2563eb;&:hover{background:#bfdbfe;}}
      &.green {background:#dcfce7;color:#16a34a;&:hover{background:#bbf7d0;}}
      &.amber {background:#fef3c7;color:#d97706;&:hover{background:#fde68a;}}
      &.red   {background:#fee2e2;color:#dc2626;&:hover{background:#fecaca;}}
    }

    .svc-empty { text-align:center;padding:48px 20px;
      i{font-size:44px;color:#d1d5db;display:block;margin-bottom:12px;}
      p{color:#6b7280;font-size:14px;margin:0 0 18px;}
    }
    .btn-outline-violet {
      border:1.5px solid #6366f1;color:#6366f1;background:transparent;
      border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;
      cursor:pointer;display:inline-flex;align-items:center;gap:6px;
      text-decoration:none;transition:background .15s;
      &:hover{background:#ede9fe;}
    }

    @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:600px){
      .shop-banner-content{flex-direction:column;align-items:flex-start;}
      .stats-grid{grid-template-columns:1fr 1fr;}
      .svc-grid{grid-template-columns:1fr;}
      .perks{flex-direction:column;align-items:center;gap:16px;}
    }
  `]
})
export class ShopManagementComponent implements OnInit {
  shop: Shop | null = null;
  services: FreelancerService[] = [];
  loadingShop = true;
  loadingServices = false;

  get stats() {
    return [
      { label: 'Total Services',  value: this.services.length,
        icon: 'ri-stack-line', color: 'v' },
      { label: 'Active', value: this.services.filter(s => s.status === 'ACTIVE').length,
        icon: 'ri-check-double-line', color: 'g' },
      { label: 'Pending Review',  value: this.services.filter(s => ['SUBMITTED','UNDER_REVIEW','PENDING_REVIEW'].includes(s.status)).length,
        icon: 'ri-time-line', color: 'y' },
      { label: 'Drafts', value: this.services.filter(s => s.status === 'DRAFT').length,
        icon: 'ri-draft-line', color: 'b' },
    ];
  }

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    public themeService: CustomizerSettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadMyShop(); }

  loadMyShop(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.loadingShop = false; return; }
    this.servicesService.getShopByFreelancer(user.id).subscribe({
      next: (shop) => { this.shop = shop; this.loadingShop = false; this.loadServices(shop.id); },
      error: () => { this.loadingShop = false; }
    });
  }

  loadServices(shopId: number): void {
    this.loadingServices = true;
    this.servicesService.getServicesByShop(shopId).subscribe({
      next: (s) => { this.services = s; this.loadingServices = false; },
      error: () => { this.loadingServices = false; }
    });
  }

  openShopDialog(): void {
    const ref = this.dialog.open(ShopFormDialogComponent, { width: '540px' });
    ref.componentInstance.data = this.shop;
    ref.afterClosed().subscribe((f: CreateShopRequest | undefined) => {
      if (!f) return;
      const call = this.shop
        ? this.servicesService.updateShop(this.shop.id, f)
        : this.servicesService.createShop(f);
      call.subscribe({
        next: (s) => {
          this.shop = s;
          this.snackBar.open('Shop saved!', 'Close', { duration: 3000 });
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Error saving shop', 'Close', { duration: 3000 })
      });
    });
  }

  submitForReview(s: FreelancerService): void {
    this.servicesService.submitForReview(s.id).subscribe({
      next: (u) => { s.status = u.status; this.snackBar.open('Submitted for review!', 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to submit', 'Close', { duration: 3000 })
    });
  }

  togglePause(s: FreelancerService): void {
    this.servicesService.togglePause(s.id).subscribe({
      next: (u) => { s.status = u.status; this.snackBar.open(u.status === 'PAUSED' ? 'Paused' : 'Activated', 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 })
    });
  }

  deleteService(s: FreelancerService): void {
    if (!confirm(`Delete "${s.title}"?`)) return;
    this.servicesService.deleteService(s.id).subscribe({
      next: () => { this.services = this.services.filter(x => x.id !== s.id); this.snackBar.open('Deleted', 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
    });
  }

  /**
   * FIX: returns null (not a fallback path) when no image exists.
   * This allows the ng-template #svcImgPh placeholder to render correctly.
   */
  getFirstImage(mediaUrls?: string): string | null {
    if (!mediaUrls) return null;
    const first = mediaUrls.split(',')[0].trim();
    return first || null;
  }

  /**
   * FIX: on broken image, hide it and inject a placeholder div so the
   * placeholder is visible even after Angular has resolved the *ngIf.
   */
  onSvcImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    const wrapper = img.parentElement;
    if (!wrapper) return;
    img.style.display = 'none';
    if (!wrapper.querySelector('.svc-img-ph')) {
      const ph = document.createElement('div');
      ph.className = 'svc-img-ph';
      ph.innerHTML = '<i class="ri-image-line"></i>';
      wrapper.insertBefore(ph, img);
    }
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      ACTIVE:        'status-active',
      DRAFT:         'status-draft',
      SUBMITTED:     'status-submitted',
      PENDING_REVIEW:'status-submitted',
      UNDER_REVIEW:  'status-under-review',
      REJECTED:      'status-rejected',
      PAUSED:        'status-paused',
      ARCHIVED:      'status-archived'
    };
    return map[s] || 'status-draft';
  }
}