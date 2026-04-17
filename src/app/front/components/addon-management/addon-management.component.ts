import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceAddOn, ServicesService, FreelancerService } from '../../services/services.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

// ─── Add/Edit Add-on Dialog ────────────────────────────────────────────────

@Component({
  selector: 'app-addon-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  styles: [`
    :host { display: block; }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0;
      margin-bottom: 20px;
    }
    .dialog-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #e8f0fe, #d2e3fc);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a73e8;
      font-size: 18px;
      flex-shrink: 0;
    }
    .dialog-title { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 0; }
    .dialog-subtitle { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

    mat-dialog-content {
      padding: 0 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 4px;
    }

    .hint-text {
      font-size: 11.5px;
      color: #9ca3af;
      margin-top: -8px;
      margin-bottom: 12px;
      padding-left: 2px;
    }

    mat-dialog-actions {
      padding: 16px 24px 24px !important;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-cancel {
      border: 1.5px solid #e5e7eb;
      color: #6b7280;
      border-radius: 8px;
      font-weight: 500;
      padding: 0 20px;
      height: 40px;
    }
    .btn-cancel:hover { background: #f9fafb; }

    .btn-save {
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      padding: 0 24px;
      height: 40px;
      box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
      border: none;
    }
    .btn-save:disabled { opacity: 0.5; box-shadow: none; }
    .btn-save:not(:disabled):hover { box-shadow: 0 4px 14px rgba(26, 115, 232, 0.4); }

    /* ── Force white on everything inside the dialog ── */
    .ld, .ld * { box-sizing: border-box; }
    .ld { background: #ffffff !important; color: #1a1a2e !important; border-radius: 16px; }
    .ld .dialog-header {
      display: flex; align-items: center; gap: 12px;
      padding: 22px 24px 18px;
      border-bottom: 1px solid #f3f4f6;
      background: #fff;
    }
    .ld .dialog-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #e8f0fe, #d2e3fc);
      display: flex; align-items: center; justify-content: center;
      color: #1a73e8; font-size: 18px;
    }
    .ld .dialog-title { font-size: 17px; font-weight: 700; color: #111827 !important; margin: 0; }
    .ld .dialog-subtitle { font-size: 12.5px; color: #6b7280 !important; margin: 3px 0 0; }
    .ld .dialog-body { padding: 20px 24px 4px; background: #fff; }
    .ld .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .ld mat-form-field { width: 100%; }
    .ld .hint-text { font-size: 11.5px; color: #9ca3af !important; margin: -8px 0 10px; }
    .ld .dialog-footer {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 10px; padding: 16px 24px 22px; background: #fff;
    }
  `],
  template: `
    <div class="ld">

      <div class="dialog-header">
        <div class="dialog-icon"><i class="ri-price-tag-3-line"></i></div>
        <div>
          <p class="dialog-title">{{ data.addon ? 'Edit Add-on' : 'New Add-on' }}</p>
          <p class="dialog-subtitle">{{ data.addon ? 'Update this add-on details' : 'Offer clients extra value for their order' }}</p>
        </div>
      </div>

      <div class="dialog-body">
        <mat-form-field appearance="outline" style="margin-top:4px">
          <mat-label>Title *</mat-label>
          <input matInput [(ngModel)]="form.title" placeholder="e.g. Extra Fast Delivery" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="form.description" placeholder="Brief description of what's included" />
        </mat-form-field>

        <div class="form-row">
          <div>
            <mat-form-field appearance="outline">
              <mat-label>Extra Price ($) *</mat-label>
              <input matInput type="number" [(ngModel)]="form.price" placeholder="0" min="0" />
              <span matPrefix style="color:#6b7280;margin-right:4px">$</span>
            </mat-form-field>
            <p class="hint-text">Added on top of base price</p>
          </div>
          <div>
            <mat-form-field appearance="outline">
              <mat-label>Extra Days</mat-label>
              <input matInput type="number" [(ngModel)]="form.extraDeliveryDays" placeholder="0" min="0" />
            </mat-form-field>
            <p class="hint-text">0 = no extra delivery time</p>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn-cancel" mat-button mat-dialog-close>Cancel</button>
        <button
          class="btn-save"
          mat-button
          [disabled]="!form.title.trim() || form.price < 0"
          (click)="save()">
          <i class="ri-check-line" style="margin-right:6px"></i>
          {{ data.addon ? 'Update Add-on' : 'Create Add-on' }}
        </button>
      </div>

    </div>
  `
})
export class AddonDialogComponent implements OnInit {
  form = { title: '', description: '', price: 0, extraDeliveryDays: 0 };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { addon?: ServiceAddOn },
    private dialogRef: MatDialogRef<AddonDialogComponent>
  ) {}

  ngOnInit(): void {
    if (this.data?.addon) {
      this.form = {
        title: this.data.addon.title,
        description: this.data.addon.description || '',
        price: this.data.addon.price,
        extraDeliveryDays: this.data.addon.extraDeliveryDays ?? 0
      };
    }
  }

  save(): void {
    if (!this.form.title.trim() || this.form.price < 0) return;
    this.dialogRef.close(this.form);
  }
}

// ─── Main Addon Management Component ──────────────────────────────────────

@Component({
  selector: 'app-addon-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: [`
    /* ── Page shell ── */
    .page-wrapper { padding: 24px; max-width: 900px; margin: 0 auto; }

    /* ── Breadcrumb ── */
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .breadcrumb-bar h5 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .breadcrumb {
      list-style: none;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0; padding: 0;
      font-size: 13px; color: #9ca3af;
    }
    .breadcrumb li a { color: #6b7280; text-decoration: none; }
    .breadcrumb li a:hover { color: #1a73e8; }
    .breadcrumb li:not(:first-child)::before { content: '/'; margin-right: 6px; }

    /* ── Service header card ── */
    .service-header-card {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .service-thumb {
      width: 58px; height: 58px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
      flex-shrink: 0;
    }
    .service-thumb-placeholder {
      width: 58px; height: 58px;
      border-radius: 10px;
      background: linear-gradient(135deg, #e8f0fe, #d2e3fc);
      border: 1px solid #d2e3fc;
      display: flex; align-items: center; justify-content: center;
      color: #1a73e8; font-size: 24px;
      flex-shrink: 0;
    }
    .service-info h5 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .service-info .price-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #059669;
      font-weight: 600;
      background: #ecfdf5;
      border-radius: 6px;
      padding: 2px 10px;
    }
    .back-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 500;
      color: #6b7280;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 7px 16px;
      background: #fff;
      cursor: pointer;
      text-decoration: none;
      transition: all .15s;
    }
    .back-btn:hover { background: #f9fafb; color: #1a1a2e; border-color: #d1d5db; }

    /* ── Add-ons card ── */
    .addons-card {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    .card-header h5 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .addon-count {
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      border-radius: 99px;
      padding: 2px 10px;
      margin-left: 8px;
      font-weight: 500;
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      color: #fff !important;
      border: none;
      border-radius: 9px;
      padding: 9px 18px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(26,115,232,.28);
      transition: box-shadow .15s, transform .1s;
    }
    .add-btn:hover { box-shadow: 0 4px 14px rgba(26,115,232,.38); transform: translateY(-1px); }

    /* ── Table ── */
    .addon-table { width: 100%; border-collapse: collapse; }
    .addon-table thead tr { background: #f8fafc; }
    .addon-table th {
      padding: 11px 20px;
      text-align: left;
      font-size: 11.5px;
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: .04em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .addon-table th.center, .addon-table td.center { text-align: center; }
    .addon-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: background .12s;
    }
    .addon-table tbody tr:last-child { border-bottom: none; }
    .addon-table tbody tr:hover { background: #fafbff; }
    .addon-table td { padding: 14px 20px; vertical-align: middle; }

    .addon-title { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .addon-desc { font-size: 13px; color: #9ca3af; }

    .price-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 13px;
      font-weight: 700;
      color: #1a73e8;
      background: #e8f0fe;
      border-radius: 6px;
      padding: 3px 10px;
    }

    .days-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12.5px;
      font-weight: 500;
      color: #6b7280;
      background: #f3f4f6;
      border-radius: 6px;
      padding: 3px 10px;
    }
    .days-chip.has-extra { color: #d97706; background: #fef3c7; }

    .action-btns { display: flex; align-items: center; justify-content: center; gap: 6px; }
    .icon-btn {
      width: 32px; height: 32px;
      border-radius: 8px;
      border: 1.5px solid transparent;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      background: transparent;
      transition: all .15s;
      font-size: 16px;
    }
    .icon-btn.edit { color: #1a73e8; border-color: #d2e3fc; }
    .icon-btn.edit:hover { background: #e8f0fe; }
    .icon-btn.delete { color: #dc2626; border-color: #fee2e2; }
    .icon-btn.delete:hover { background: #fef2f2; }

    /* ── Empty state ── */
    .empty-state {
      padding: 60px 24px;
      text-align: center;
    }
    .empty-icon {
      width: 64px; height: 64px;
      border-radius: 16px;
      background: #f3f4f6;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      font-size: 28px; color: #9ca3af;
    }
    .empty-state h5 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 6px; }
    .empty-state p { font-size: 13.5px; color: #9ca3af; margin: 0 0 20px; }
    .empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1.5px solid #1a73e8;
      color: #1a73e8;
      background: #fff;
      border-radius: 9px;
      padding: 9px 20px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .empty-cta:hover { background: #e8f0fe; }

    /* ── Info tip ── */
    .info-tip {
      margin: 0;
      padding: 16px 24px;
      background: #f0f7ff;
      border-top: 1px solid #e0eeff;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .info-tip i { color: #1a73e8; font-size: 18px; margin-top: 1px; flex-shrink: 0; }
    .info-tip p { margin: 0; font-size: 13px; color: #374151; line-height: 1.55; }

    /* ── Loading ── */
    .loading-state {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 48px;
      font-size: 14px; color: #9ca3af;
    }
  `],
  template: `
    <div class="page-wrapper">

      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <h5>Manage Add-ons</h5>
        <ol class="breadcrumb">
          <li><a routerLink="/"><i class="ri-home-8-line me-4"></i>Dashboard</a></li>
          <li><a routerLink="/my-shop">My Shop</a></li>
          <li>Add-ons</li>
        </ol>
      </div>

      <!-- Service Header -->
      <div class="service-header-card">
        <img
          *ngIf="service?.images?.[0] && !imageError"
          [src]="service!.images![0]"
          class="service-thumb"
          alt="Service thumbnail"
          (error)="imageError = true"
        />
        <div *ngIf="!service?.images?.[0] || imageError" class="service-thumb-placeholder">
          <i class="ri-image-line"></i>
        </div>
        <div class="service-info">
          <h5>{{ service?.title || '—' }}</h5>
          <span class="price-badge">
            <i class="ri-money-dollar-circle-line"></i>
            Base Price: {{ '$' + service?.price }}
          </span>
        </div>
        <a class="back-btn" routerLink="/my-shop">
          <i class="ri-arrow-left-line"></i> Back to Shop
        </a>
      </div>

      <!-- Add-ons Card -->
      <div class="addons-card">

        <!-- Card Header -->
        <div class="card-header">
          <h5>
            Service Add-ons
            <span class="addon-count">{{ addOns.length }}</span>
          </h5>
          <button class="add-btn" (click)="openDialog()">
            <i class="ri-add-line"></i>
            Add Add-on
          </button>
        </div>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <mat-spinner diameter="22"></mat-spinner>
          Loading add-ons…
        </div>

        <!-- Table -->
        <ng-container *ngIf="!loading && addOns.length > 0">
          <table class="addon-table">
            <thead>
              <tr>
                <th>Add-on</th>
                <th>Description</th>
                <th class="center">Extra Price</th>
                <th class="center">Extra Time</th>
                <th class="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let addon of addOns">
                <td><span class="addon-title">{{ addon.title }}</span></td>
                <td><span class="addon-desc">{{ addon.description || '—' }}</span></td>
                <td class="center">
                  <span class="price-chip">+{{ '$' + addon.price }}</span>
                </td>
                <td class="center">
                  <span class="days-chip" [class.has-extra]="(addon.extraDeliveryDays ?? 0) > 0">
                    <i class="ri-time-line"></i>
                    {{ (addon.extraDeliveryDays ?? 0) > 0
                        ? '+' + addon.extraDeliveryDays + ' days'
                        : 'No extra time' }}
                  </span>
                </td>
                <td class="center">
                  <div class="action-btns">
                    <button class="icon-btn edit" matTooltip="Edit" (click)="openDialog(addon)">
                      <i class="ri-edit-line"></i>
                    </button>
                    <button class="icon-btn delete" matTooltip="Delete" (click)="deleteAddOn(addon)">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Info tip -->
          <div class="info-tip">
            <i class="ri-lightbulb-line"></i>
            <p>Add-ons let clients upgrade their order with extras like faster delivery or additional revisions, increasing your average order value.</p>
          </div>
        </ng-container>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading && addOns.length === 0">
          <div class="empty-icon"><i class="ri-price-tag-3-line"></i></div>
          <h5>No add-ons yet</h5>
          <p>Offer clients extras to increase your service value</p>
          <button class="empty-cta" (click)="openDialog()">
            <i class="ri-add-line"></i> Create First Add-on
          </button>
        </div>

      </div>
    </div>
  `
})
export class AddonManagementComponent implements OnInit {
  serviceId: number = 0;
  service: FreelancerService | null = null;
  addOns: ServiceAddOn[] = [];
  loading = true;
  imageError = false;

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    public themeService: CustomizerSettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadService();
    this.loadAddOns();
  }

  loadService(): void {
    this.servicesService.getServiceById(this.serviceId).subscribe({
      next: (s) => (this.service = s),
      error: (e) => console.error('Error loading service:', e)
    });
  }

  loadAddOns(): void {
    this.loading = true;
    this.servicesService.getAddOnsByService(this.serviceId).subscribe({
      next: (a) => { this.addOns = a; this.loading = false; },
      error: (e) => { console.error('Error loading add-ons:', e); this.loading = false; }
    });
  }

  openDialog(addon?: ServiceAddOn): void {
    const ref = this.dialog.open(AddonDialogComponent, {
      width: '480px',
      panelClass: 'addon-dialog-panel',
      data: { addon }
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      if (addon) {
        // Edit
        this.servicesService.updateAddOn(addon.id, {
          title: result.title,
          description: result.description,
          price: result.price,
          extraDeliveryDays: result.extraDeliveryDays
        }).subscribe({
          next: () => {
            this.snackBar.open('Add-on updated!', 'Close', { duration: 3000 });
            this.loadAddOns();
          },
          error: (e) => {
            console.error('Error updating add-on:', e);
            this.snackBar.open('Failed to update add-on', 'Close', { duration: 3000 });
          }
        });
      } else {
        // Create
        this.servicesService.createAddOn(this.serviceId, {
          title: result.title,
          description: result.description,
          price: result.price,
          extraDeliveryDays: result.extraDeliveryDays
        }).subscribe({
          next: () => {
            this.snackBar.open('Add-on created!', 'Close', { duration: 3000 });
            this.loadAddOns();
          },
          error: (e) => {
            console.error('Error creating add-on:', e);
            this.snackBar.open('Failed to create add-on', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteAddOn(addon: ServiceAddOn): void {
    if (!confirm(`Delete "${addon.title}"?`)) return;
    this.servicesService.deleteAddOn(addon.id).subscribe({
      next: () => {
        this.addOns = this.addOns.filter((a) => a.id !== addon.id);
        this.snackBar.open('Add-on deleted', 'Close', { duration: 3000 });
      },
      error: (e) => {
        console.error('Error deleting add-on:', e);
        this.snackBar.open('Failed to delete', 'Close', { duration: 3000 });
      }
    });
  }
}