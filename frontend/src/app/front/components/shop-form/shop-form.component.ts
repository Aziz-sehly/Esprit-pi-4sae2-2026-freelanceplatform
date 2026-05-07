import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Shop, CreateShopRequest, ServicesService } from '../../services/services.service';
import { AuthService } from '../../services/auth.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-shop-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- Breadcrumb -->
    <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
      <h5 class="mb-0">{{isEditMode ? 'Edit Shop' : 'Create Your Shop'}}</h5>
      <ol class="breadcrumb list-unstyled mt-0 mb-0 pl-0">
        <li class="breadcrumb-item position-relative">
          <a routerLink="/" class="d-inline-block position-relative">
            <i class="ri-home-8-line"></i>
            Dashboard
          </a>
        </li>
        <li class="breadcrumb-item position-relative">
          <a routerLink="/my-shop">My Shop</a>
        </li>
        <li class="breadcrumb-item position-relative">
          {{isEditMode ? 'Edit' : 'Create'}}
        </li>
      </ol>
    </div>

    <div class="row">
      <div class="col-lg-8">
        <mat-card class="daxa-card border-radius bg-white border-none d-block"
          [class.component-dark-theme]="themeService.isDark()">
          <mat-card-content class="p-20">
            <form #shopForm="ngForm" (ngSubmit)="onSubmit()">

              <!-- Shop Name -->
              <!-- ✅ FIXED: was [(ngModel)]="shopData.name" — now uses shopData.shopName -->
              <mat-form-field appearance="outline" class="w-100 mb-20">
                <mat-label>Shop Name *</mat-label>
                <input matInput
                       [(ngModel)]="shopData.shopName"
                       name="shopName"
                       required
                       maxlength="100"
                       placeholder="e.g. Creative Design Studio">
                <mat-hint align="end">{{shopData.shopName?.length || 0}}/100</mat-hint>
              </mat-form-field>

              <!-- Description -->
              <mat-form-field appearance="outline" class="w-100 mb-20">
                <mat-label>Shop Description *</mat-label>
                <textarea matInput
                          [(ngModel)]="shopData.description"
                          name="description"
                          required
                          rows="4"
                          maxlength="500"
                          placeholder="Describe your shop and what you offer..."></textarea>
                <mat-hint align="end">{{shopData.description?.length || 0}}/500</mat-hint>
              </mat-form-field>

              <!-- Logo URL -->
              <!-- ✅ FIXED: was [(ngModel)]="shopData.logoUrl" name="logoUrl" — now avatarUrl -->
              <mat-form-field appearance="outline" class="w-100 mb-20">
                <mat-label>Shop Logo URL</mat-label>
                <input matInput
                       [(ngModel)]="shopData.avatarUrl"
                       name="avatarUrl"
                       placeholder="https://example.com/logo.png">
                <mat-hint>Recommended size: 400x400px</mat-hint>
              </mat-form-field>

              <!-- Banner URL -->
              <mat-form-field appearance="outline" class="w-100 mb-20">
                <mat-label>Shop Banner URL</mat-label>
                <input matInput
                       [(ngModel)]="shopData.bannerUrl"
                       name="bannerUrl"
                       placeholder="https://example.com/banner.png">
                <mat-hint>Recommended size: 1200x400px</mat-hint>
              </mat-form-field>

              <!-- Preview Section -->
              <div class="preview-section mt-30 p-20 border-radius"
                   style="background: #f8f9fa;"
                   [style.background]="themeService.isDark() ? '#1a1d29' : '#f8f9fa'">
                <h6 class="mb-15">Preview</h6>
                <div class="d-flex align-items-center">
                  <!-- ✅ FIXED: was shopData.logoUrl — now shopData.avatarUrl -->
                  <img [src]="shopData.avatarUrl || 'images/users/default-shop.png'"
                       class="rounded-circle border me-15"
                       style="width: 80px; height: 80px; object-fit: cover;">
                  <div>
                    <!-- ✅ FIXED: was shopData.name — now shopData.shopName -->
                    <h5 class="mb-5">{{shopData.shopName || 'Your Shop Name'}}</h5>
                    <p class="text-body mb-0">{{shopData.description || 'Your shop description will appear here...' | slice:0:100}}...</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex justify-content-end gap-15 mt-30">
                <button mat-button type="button" routerLink="/my-shop">Cancel</button>
                <button mat-raised-button
                        color="primary"
                        type="submit"
                        [disabled]="!shopForm.valid || loading"
                        style="background: var(--daxaColor);">
                  <mat-spinner diameter="20" *ngIf="loading" class="me-10"></mat-spinner>
                  {{isEditMode ? 'Save Changes' : 'Create Shop'}}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tips Sidebar -->
      <div class="col-lg-4">
        <mat-card class="daxa-card border-radius bg-white border-none d-block mb-25"
          [class.component-dark-theme]="themeService.isDark()">
          <mat-card-header>
            <mat-card-title>
              <h6 class="mb-0">Tips for a Great Shop</h6>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ul class="tips-list list-unstyled mb-0">
              <li class="d-flex mb-15">
                <i class="ri-check-line text-success me-10 mt-2"></i>
                <span class="text-body">Choose a clear, professional shop name</span>
              </li>
              <li class="d-flex mb-15">
                <i class="ri-check-line text-success me-10 mt-2"></i>
                <span class="text-body">Write a detailed description of your expertise</span>
              </li>
              <li class="d-flex mb-15">
                <i class="ri-check-line text-success me-10 mt-2"></i>
                <span class="text-body">Use high-quality logo and banner images</span>
              </li>
              <li class="d-flex mb-15">
                <i class="ri-check-line text-success me-10 mt-2"></i>
                <span class="text-body">Add multiple services to attract more clients</span>
              </li>
              <li class="d-flex">
                <i class="ri-check-line text-success me-10 mt-2"></i>
                <span class="text-body">Keep your shop active and respond quickly</span>
              </li>
            </ul>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .tips-list {
      li {
        font-size: 14px;
      }
    }
  `]
})
export class ShopFormComponent implements OnInit {

  // ✅ FIXED: was { name: '', logoUrl: '' } — now uses correct backend field names
  shopData: CreateShopRequest = {
    shopName: '',
    description: '',
    avatarUrl: '',
    bannerUrl: ''
  };

  existingShop: Shop | null = null;
  isEditMode = false;
  loading = false;

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    public themeService: CustomizerSettingsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkExistingShop();
  }

  checkExistingShop(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.servicesService.getShopByFreelancer(user.id).subscribe({
        next: (shop) => {
          this.existingShop = shop;
          this.isEditMode = true;
          // ✅ FIXED: was shop.name / shop.logoUrl — now uses correct field names
          this.shopData = {
            shopName:    shop.shopName,
            description: shop.description || '',
            avatarUrl:   shop.avatarUrl   || '',
            bannerUrl:   shop.bannerUrl   || ''
          };
        },
        error: () => {
          this.isEditMode = false;
        }
      });
    }
  }

  onSubmit(): void {
    // ✅ FIXED: was shopData.name — now shopData.shopName
    if (!this.shopData.shopName?.trim() || !this.shopData.description?.trim()) {
      this.snackBar.open('Name and description are required', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.existingShop) {
      this.servicesService.updateShop(this.existingShop.id, this.shopData).subscribe({
        next: () => {
          this.snackBar.open('Shop updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/my-shop']);
        },
        error: (err) => {
          console.error('Error updating shop:', err);
          this.snackBar.open('Failed to update shop', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      this.servicesService.createShop(this.shopData).subscribe({
        next: () => {
          this.snackBar.open('Shop created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/my-shop']);
        },
        error: (err) => {
          console.error('Error creating shop:', err);
          this.snackBar.open('Failed to create shop', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }
}