import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CarouselModule } from 'ngx-owl-carousel-o';
import {
  FreelancerService,
  ServiceAddOn,
  ServicesService,
  CreateCustomOfferRequest
} from '../../services/services.service';
import { AuthService } from '../../services/auth.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { QuantityCounterComponent } from '../../../quantity-counter/quantity-counter.component';

@Component({
  selector: 'app-custom-offer-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
            MatInputModule, MatButtonModule],
  styles: [`
    .cod { background:#fff; color:#111827; border-radius:14px; overflow:hidden; }

    .cod-header {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      padding: 22px 24px 18px; color:#fff;
    }
    .cod-header h3 { margin:0 0 4px; font-size:17px; font-weight:700; }
    .cod-header p  { margin:0; font-size:13px; opacity:.82; }

    .cod-body { padding:20px 24px 4px; background:#fff; }
    mat-form-field { width:100%; margin-bottom:4px; }
    .cod-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .cod-footer {
      display:flex; align-items:center; justify-content:flex-end;
      gap:10px; padding:14px 24px 22px; background:#fff;
    }
    .btn-cancel {
      border:1.5px solid #e5e7eb !important; color:#6b7280 !important;
      border-radius:8px !important; background:#fff !important; height:38px; padding:0 18px !important;
    }
    .btn-send {
      background:linear-gradient(135deg,#6366f1,#8b5cf6) !important;
      color:#fff !important; border:none !important; border-radius:8px !important;
      font-weight:600 !important; height:38px; padding:0 22px !important;
    }
    .btn-send:disabled { opacity:.45; }
  `],
  template: `
    <div class="cod">
      <div class="cod-header">
        <h3>Request Custom Offer</h3>
        <p>Describe your needs and the freelancer will send a tailored offer.</p>
      </div>
      <div class="cod-body">
        <mat-form-field appearance="outline" style="margin-top:8px">
          <mat-label>Project Title</mat-label>
          <input matInput [(ngModel)]="form.title" placeholder="e.g. Custom Logo Design" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="form.description" rows="4"
                    placeholder="Describe your requirements in detail..."></textarea>
        </mat-form-field>
        <div class="cod-row">
          <mat-form-field appearance="outline">
            <mat-label>Budget ($)</mat-label>
            <input matInput type="number" [(ngModel)]="form.price" placeholder="100" min="1" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Delivery (days)</mat-label>
            <input matInput type="number" [(ngModel)]="form.deliveryTimeDays" placeholder="7" min="1" />
          </mat-form-field>
        </div>
      </div>
      <div class="cod-footer">
        <button class="btn-cancel" mat-button mat-dialog-close>Cancel</button>
        <button class="btn-send" mat-button
                [disabled]="!form.title || !form.description || !form.price"
                [mat-dialog-close]="form">
          <i class="ri-send-plane-line" style="margin-right:6px"></i> Send Request
        </button>
      </div>
    </div>
  `
})
export class CustomOfferDialogComponent {
  form: CreateCustomOfferRequest = {
    receiverId: 0, title: '', description: '', price: 0, deliveryTimeDays: 7
  };
}

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTabsModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    CarouselModule,
    QuantityCounterComponent
  ],
  styles: [`
    :host {
      display: block;
      background: #f5f6fa;
      min-height: 100vh;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .breadcrumb-bar {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 8px;
      background: #fff; border-radius: 12px; padding: 14px 20px;
      margin-bottom: 22px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .breadcrumb-bar h5 { margin:0; font-size:16px; font-weight:700; color:#111827; }
    .breadcrumb {
      list-style:none; display:flex; align-items:center; gap:6px;
      margin:0; padding:0; font-size:13px; color:#9ca3af;
    }
    .breadcrumb li a { color:#6366f1; text-decoration:none; }
    .breadcrumb li a:hover { text-decoration:underline; }
    .breadcrumb li:not(:first-child)::before { content:'/'; margin-right:6px; }

    .page-loading {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:100px 0; gap:16px; color:#6b7280; font-size:15px;
    }

    .sd-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    .sd-left { display:flex; flex-direction:column; gap:20px; }

    .gallery-card {
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .main-image { width:100%; height:380px; object-fit:cover; display:block; }
    .main-image-placeholder {
      width:100%; height:380px; background:linear-gradient(135deg,#ede9fe,#ddd6fe);
      display:flex; align-items:center; justify-content:center;
    }
    .main-image-placeholder i { font-size:56px; color:#8b5cf6; }
    .thumbnails {
      display:flex; gap:10px; padding:14px 16px; overflow-x:auto; scrollbar-width:thin;
    }
    .thumb {
      width:80px; height:58px; border-radius:8px; object-fit:cover;
      border:2px solid transparent; cursor:pointer; flex-shrink:0; transition:border-color .15s;
    }
    .thumb.active { border-color:#6366f1; }
    .thumb:hover { border-color:#a5b4fc; }

    .info-card {
      background:#fff; border-radius:16px; padding:24px;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .service-title { margin:0 0 12px; font-size:22px; font-weight:700; color:#111827; line-height:1.35; }
    .meta-row { display:flex; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; }
    .meta-chip {
      display:inline-flex; align-items:center; gap:5px;
      font-size:13px; color:#6b7280; background:#f3f4f6;
      border-radius:20px; padding:4px 12px;
    }
    .meta-chip i { font-size:14px; }
    .meta-chip.price { background:#ecfdf5; color:#059669; font-weight:700; font-size:15px; }
    .meta-chip.cat   { background:#ede9fe; color:#6d28d9; font-weight:600; }
    .tags-row { display:flex; flex-wrap:wrap; gap:7px; }
    .tag {
      background:#f0f4ff; color:#4f46e5; border-radius:20px;
      padding:3px 11px; font-size:12px; font-weight:500;
    }

    .tabs-card {
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
    }

    ::ng-deep .sd-tabs .mat-mdc-tab-header { border-bottom:1px solid #f3f4f6; background:#fff; }
    ::ng-deep .sd-tabs .mat-mdc-tab { color:#6b7280 !important; }
    ::ng-deep .sd-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color:#6366f1 !important; }
    ::ng-deep .sd-tabs .mdc-tab-indicator__content--underline { border-color:#6366f1 !important; }
    ::ng-deep .sd-tabs .mat-mdc-tab-body-wrapper { background:#fff; }

    .tab-content { padding:22px 24px; }
    .desc-text { color:#374151; font-size:14.5px; line-height:1.7; margin:0 0 20px; }
    .section-label { font-size:13px; font-weight:700; color:#111827; margin:0 0 10px; text-transform:uppercase; letter-spacing:.04em; }
    .req-list { list-style:none; padding:0; margin:0 0 20px; }
    .req-list li { display:flex; align-items:flex-start; gap:8px; color:#374151; font-size:14px; margin-bottom:8px; }
    .req-list li i { color:#10b981; font-size:16px; flex-shrink:0; margin-top:1px; }

    .rating-overview { display:flex; align-items:center; gap:28px; margin-bottom:24px; }
    .rating-big { text-align:center; }
    .rating-big .num { font-size:48px; font-weight:800; color:#111827; line-height:1; }
    .rating-big .stars { display:flex; gap:3px; justify-content:center; margin:6px 0 4px; }
    .rating-big .stars i { font-size:18px; color:#fbbf24; }
    .rating-big .stars i.dim { color:#e5e7eb; }
    .rating-big .cnt { font-size:12px; color:#9ca3af; }
    .rating-bars { flex:1; }
    .bar-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; color:#6b7280; }
    .bar-row span:first-child { width:40px; text-align:right; white-space:nowrap; }
    .bar-row mat-progress-bar { flex:1; height:6px; border-radius:4px; }
    .bar-row span:last-child { width:28px; }
    .review-card {
      background:#f9fafb; border-radius:12px; padding:18px; margin-bottom:14px; border:1px solid #f3f4f6;
    }
    .review-card .r-stars { display:flex; gap:2px; margin-bottom:8px; }
    .review-card .r-stars i { color:#fbbf24; font-size:14px; }
    .review-card .r-text { color:#374151; font-size:14px; line-height:1.6; margin:0 0 14px; }
    .review-card .r-user { display:flex; align-items:center; gap:10px; }
    .review-card .r-user img { width:36px; height:36px; border-radius:50%; object-fit:cover; }
    .review-card .r-name { font-size:13.5px; font-weight:600; color:#111827; }
    .review-card .r-date { font-size:12px; color:#9ca3af; }
    .faq-item { margin-bottom:16px; }
    .faq-item h6 { margin:0 0 6px; font-size:14.5px; font-weight:700; color:#111827; }
    .faq-item p  { margin:0; color:#6b7280; font-size:14px; line-height:1.6; }

    .pricing-card {
      background:#fff; border-radius:16px;
      box-shadow:0 4px 24px rgba(0,0,0,.09);
      position:sticky; top:24px; overflow:hidden;
    }
    .pc-header { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:18px 20px; color:#fff; }
    .pc-service-title { font-size:15px; font-weight:700; margin:0 0 6px; line-height:1.35; }
    .pc-desc { font-size:12.5px; opacity:.82; margin:0; }
    .pc-body { padding:18px 20px; }

    .fl-row {
      display:flex; align-items:center; gap:12px;
      padding-bottom:16px; margin-bottom:16px; border-bottom:1px solid #f3f4f6;
    }
    .fl-avatar { width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
    .fl-avatar-ph {
      width:44px; height:44px; border-radius:50%; background:#ede9fe;
      display:flex; align-items:center; justify-content:center;
    }
    .fl-avatar-ph i { font-size:22px; color:#7c3aed; }
    .fl-name { font-size:14px; font-weight:600; color:#111827; margin:0 0 2px; }
    .fl-level { font-size:12px; color:#9ca3af; margin:0; }
    .btn-contact {
      margin-left:auto; background:#fff; color:#6366f1; border:1.5px solid #6366f1;
      border-radius:8px; padding:6px 14px; font-size:12.5px; font-weight:600; cursor:pointer;
      transition:all .15s; white-space:nowrap;
    }
    .btn-contact:hover { background:#ede9fe; }

    .pc-meta { display:flex; gap:16px; margin-bottom:16px; }
    .pc-meta-item { display:flex; align-items:center; gap:6px; font-size:13px; color:#6b7280; }
    .pc-meta-item i { color:#6366f1; font-size:16px; }
    .pc-meta-item strong { color:#111827; }

    .addons-section { margin-bottom:16px; }
    .addons-label { font-size:13px; font-weight:700; color:#111827; margin:0 0 10px; }
    .addon-item {
      border:1.5px solid #e5e7eb; border-radius:10px; padding:12px;
      margin-bottom:8px; cursor:pointer; transition:all .15s; display:flex; align-items:flex-start; gap:10px;
    }
    .addon-item:hover { border-color:#a5b4fc; background:#fafbff; }
    .addon-item.selected { border-color:#6366f1; background:#f0f4ff; }
    .addon-check {
      width:18px; height:18px; border-radius:4px; border:2px solid #d1d5db;
      display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;
      background:#fff; transition:all .15s;
    }
    .addon-check i { font-size:12px; color:transparent; }
    .addon-check.checked { background:#6366f1; border-color:#6366f1; }
    .addon-check.checked i { color:#fff; }
    .addon-info { flex:1; }
    .addon-name { font-size:13.5px; font-weight:600; color:#111827; margin:0 0 2px; }
    .addon-desc { font-size:12px; color:#9ca3af; margin:0 0 4px; }
    .addon-price { font-size:13px; font-weight:700; color:#6366f1; }
    .addon-days  { font-size:11.5px; color:#9ca3af; margin-left:6px; }

    .price-breakdown { background:#f9fafb; border-radius:10px; padding:14px; margin-bottom:14px; }
    .pb-row {
      display:flex; justify-content:space-between; align-items:center;
      font-size:13.5px; color:#6b7280; margin-bottom:8px;
    }
    .pb-row:last-child { margin:0; }
    .pb-row span:last-child { color:#111827; font-weight:500; }
    .pb-divider { border:none; border-top:1px solid #e5e7eb; margin:10px 0; }
    .pb-total {
      display:flex; justify-content:space-between; align-items:center;
      font-size:16px; font-weight:700; color:#111827;
    }
    .pb-total .total-val { color:#6366f1; font-size:20px; }
    .pb-delivery {
      display:flex; justify-content:space-between; align-items:center;
      font-size:13px; margin-top:10px; color:#6b7280;
    }
    .pb-delivery span:last-child { font-weight:600; color:#10b981; }

    .qty-row {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:14px; font-size:13.5px; color:#374151; font-weight:500;
    }

    .btn-continue {
      width:100%; background:linear-gradient(135deg,#6366f1,#8b5cf6);
      color:#fff; border:none; border-radius:10px; padding:14px;
      font-size:15px; font-weight:700; cursor:pointer; margin-bottom:10px;
      box-shadow:0 4px 14px rgba(99,102,241,.32); transition:all .2s;
    }
    .btn-continue:hover { box-shadow:0 6px 20px rgba(99,102,241,.42); transform:translateY(-1px); }
    .btn-continue:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; transform:none; }
    .btn-custom {
      width:100%; background:#fff; color:#6366f1; border:1.5px solid #6366f1;
      border-radius:10px; padding:11px; font-size:14px; font-weight:600;
      cursor:pointer; margin-bottom:8px; display:flex; align-items:center; justify-content:center;
      gap:7px; transition:all .15s;
    }
    .btn-custom:hover { background:#ede9fe; }
    .btn-fav {
      width:100%; background:#fff; color:#6b7280; border:1.5px solid #e5e7eb;
      border-radius:10px; padding:10px; font-size:13.5px; font-weight:500;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
      transition:all .15s;
    }
    .btn-fav:hover { border-color:#f43f5e; color:#f43f5e; }
    .btn-fav.faved { color:#f43f5e; border-color:#fecdd3; background:#fff1f2; }
    .secure-note {
      text-align:center; font-size:12px; color:#9ca3af; margin-top:10px;
      display:flex; align-items:center; justify-content:center; gap:4px;
    }
    .secure-note i { font-size:14px; color:#10b981; }

    @media (max-width: 960px) {
      .sd-layout { grid-template-columns: 1fr; }
      .pricing-card { position:static; }
    }
  `],
  template: `
    <div class="breadcrumb-bar">
      <h5>Service Details</h5>
      <ol class="breadcrumb">
        <li><a routerLink="/front">Home</a></li>
        <li><a routerLink="/front/services">Services</a></li>
        <li>{{ service?.title | slice:0:30 }}{{ (service?.title?.length ?? 0) > 30 ? '...' : '' }}</li>
      </ol>
    </div>

    <div class="page-loading" *ngIf="loading">
      <mat-spinner diameter="44"></mat-spinner>
      <span>Loading service...</span>
    </div>

    <div class="page-loading" *ngIf="!loading && !service">
      <i class="ri-error-warning-line" style="font-size:44px;color:#ef4444"></i>
      <span>Service not found.</span>
      <a routerLink="/front/services" style="color:#6366f1;font-weight:600">Browse services</a>
    </div>

    <div class="sd-layout" *ngIf="!loading && service">

      <div class="sd-left">

        <div class="gallery-card">
          <img *ngIf="activeImage" [src]="activeImage" class="main-image" [alt]="service.title"
               (error)="activeImage = ''">
          <div class="main-image-placeholder" *ngIf="!activeImage">
            <i class="ri-image-line"></i>
          </div>
          <div class="thumbnails" *ngIf="serviceImages.length > 1">
            <img *ngFor="let img of serviceImages; let i = index"
                 [src]="img" class="thumb" [class.active]="activeImage === img"
                 [alt]="'Image ' + (i+1)"
                 (click)="activeImage = img"
                 (error)="removeImage(i)">
          </div>
        </div>

        <div class="info-card">
          <h1 class="service-title">{{ service.title }}</h1>
          <div class="meta-row">
            <span class="meta-chip price">
              <i class="ri-money-dollar-circle-line"></i>
              from \${{ service.price }}
            </span>
            <span class="meta-chip cat">
              <i class="ri-price-tag-3-line"></i>
              {{ service.category }}
            </span>
            <span class="meta-chip">
              <i class="ri-time-line"></i>
              {{ service.deliveryTimeDays ?? service.deliveryDays }} days delivery
            </span>
            <span class="meta-chip">
              <i class="ri-refresh-line"></i>
              {{ service.revisionCount ?? 0 }} revisions
            </span>
          </div>
          <div class="tags-row" *ngIf="serviceTags.length">
            <span class="tag" *ngFor="let t of serviceTags">{{ t }}</span>
          </div>
        </div>

        <div class="tabs-card">
          <mat-tab-group class="sd-tabs" animationDuration="0ms">

            <mat-tab label="Description">
              <div class="tab-content">
                <p class="desc-text">{{ service.description }}</p>
                <ng-container *ngIf="service.requirements?.length">
                  <p class="section-label">What You'll Get</p>
                  <ul class="req-list">
                    <li *ngFor="let r of service.requirements">
                      <i class="ri-check-double-line"></i> {{ r }}
                    </li>
                  </ul>
                </ng-container>
              </div>
            </mat-tab>

            <mat-tab [label]="'Reviews (' + (service.reviewCount ?? 0) + ')'">
              <div class="tab-content">
                <div class="rating-overview">
                  <div class="rating-big">
                    <div class="num">{{ service.rating ?? 0 }}</div>
                    <div class="stars">
                      <i *ngFor="let s of [1,2,3,4,5]" class="ri-star-fill"
                         [class.dim]="s > (service.rating ?? 0)"></i>
                    </div>
                    <div class="cnt">{{ service.reviewCount ?? 0 }} reviews</div>
                  </div>
                  <div class="rating-bars">
                    <div class="bar-row" *ngFor="let r of [5,4,3,2,1]">
                      <span>{{ r }} <i class="ri-star-fill"></i></span>
                      <mat-progress-bar mode="determinate" [value]="getRatingPct(r)"></mat-progress-bar>
                      <span>{{ getRatingCount(r) }}</span>
                    </div>
                  </div>
                </div>
                <div class="review-card" *ngIf="(service.reviewCount ?? 0) > 0">
                  <div class="r-stars">
                    <i class="ri-star-fill" *ngFor="let s of [1,2,3,4,5]"></i>
                  </div>
                  <p class="r-text">Excellent work! Delivered exactly what I needed on time.</p>
                  <div class="r-user">
                    <img src="images/users/user1.jpg" alt="Reviewer" (error)="hideReviewAvatar($event)">
                    <div>
                      <p class="r-name">John Doe</p>
                      <p class="r-date">2 weeks ago</p>
                    </div>
                  </div>
                </div>
                <p *ngIf="(service.reviewCount ?? 0) === 0" style="color:#9ca3af;font-size:14px">
                  No reviews yet. Be the first to order!
                </p>
              </div>
            </mat-tab>

            <mat-tab label="FAQ">
              <div class="tab-content">
                <div class="faq-item">
                  <h6>How do I place an order?</h6>
                  <p>Select any extras you want, set your quantity, then click Continue. You'll provide your project details at checkout.</p>
                </div>
                <mat-divider style="margin:14px 0"></mat-divider>
                <div class="faq-item">
                  <h6>What if I need something custom?</h6>
                  <p>Click "Request Custom Offer" and describe your needs. The freelancer will send you a tailored quote.</p>
                </div>
                <mat-divider style="margin:14px 0"></mat-divider>
                <div class="faq-item">
                  <h6>What if I'm not satisfied?</h6>
                  <p>You are entitled to revisions as stated in the package. If the work doesn't meet agreed requirements, you can open a dispute.</p>
                </div>
              </div>
            </mat-tab>

          </mat-tab-group>
        </div>

      </div>

      <div>
        <div class="pricing-card">

          <div class="pc-header">
            <p class="pc-service-title">{{ service.title }}</p>
            <p class="pc-desc">{{ service.description | slice:0:90 }}{{ (service.description?.length ?? 0) > 90 ? '...' : '' }}</p>
          </div>

          <div class="pc-body">

            <div class="fl-row">
              <div class="fl-avatar-ph"><i class="ri-user-line"></i></div>
              <div>
                <p class="fl-name">Freelancer</p>
                <p class="fl-level">Shop #{{ service.shopId }}</p>
              </div>
              <button class="btn-contact" (click)="contactFreelancer()">Contact</button>
            </div>

            <div class="pc-meta">
              <div class="pc-meta-item">
                <i class="ri-time-line"></i>
                <span><strong>{{ service.deliveryTimeDays ?? service.deliveryDays }}</strong> days delivery</span>
              </div>
              <div class="pc-meta-item">
                <i class="ri-refresh-line"></i>
                <span><strong>{{ service.revisionCount ?? 0 }}</strong> revisions</span>
              </div>
            </div>

            <mat-divider style="margin-bottom:16px"></mat-divider>

            <div class="addons-section" *ngIf="addOns.length > 0">
              <p class="addons-label">Upgrade your order</p>
              <div class="addon-item" *ngFor="let addon of addOns"
                   [class.selected]="addon.selected"
                   (click)="toggleAddon(addon)">
                <div class="addon-check" [class.checked]="addon.selected">
                  <i class="ri-check-line"></i>
                </div>
                <div class="addon-info">
                  <p class="addon-name">{{ addon.title }}</p>
                  <p class="addon-desc" *ngIf="addon.description">{{ addon.description }}</p>
                  <span class="addon-price">+\${{ addon.price }}</span>
                  <span class="addon-days" *ngIf="(addon.extraDeliveryDays ?? 0) > 0">
                    (+{{ addon.extraDeliveryDays }} days)
                  </span>
                </div>
              </div>
            </div>

            <div class="qty-row">
              <span>Quantity</span>
              <app-quantity-counter [value]="quantity" (valueChange)="updateQty($event)">
              </app-quantity-counter>
            </div>

            <div class="price-breakdown">
              <div class="pb-row">
                <span>Base price</span>
                <span>\${{ service.price }}</span>
              </div>
              <div class="pb-row" *ngIf="addOnsTotal > 0">
                <span>Add-ons</span>
                <span>+\${{ addOnsTotal }}</span>
              </div>
              <div class="pb-row">
                <span>Service fee (5%)</span>
                <span>\${{ platformFee | number:'1.2-2' }}</span>
              </div>
              <div class="pb-row" *ngIf="quantity > 1">
                <span>Quantity</span>
                <span>x {{ quantity }}</span>
              </div>
              <hr class="pb-divider">
              <div class="pb-total">
                <span>Total</span>
                <span class="total-val">\${{ grandTotal | number:'1.2-2' }}</span>
              </div>
              <div class="pb-delivery">
                <span>Estimated delivery</span>
                <span>{{ totalDeliveryDays }} days</span>
              </div>
            </div>

            <button class="btn-continue" (click)="continueToOrder()">
              Continue - \${{ grandTotal | number:'1.2-2' }}
            </button>

            <button class="btn-custom" (click)="requestCustomOffer()">
              <i class="ri-mail-send-line"></i> Request Custom Offer
            </button>

            <button class="btn-fav" [class.faved]="isFaved" (click)="toggleFav()">
              <i [class]="isFaved ? 'ri-heart-fill' : 'ri-heart-line'"></i>
              {{ isFaved ? 'Saved to Favourites' : 'Add to Favourites' }}
            </button>

            <p class="secure-note">
              <i class="ri-shield-check-line"></i> SSL Secure - Safe payments
            </p>

          </div>
        </div>
      </div>

    </div>
  `
})
export class ServiceDetailsComponent implements OnInit {
  service: FreelancerService | null = null;
  addOns: (ServiceAddOn & { selected?: boolean })[] = [];
  serviceImages: string[] = [];
  serviceTags: string[] = [];
  activeImage = '';

  loading = true;
  quantity = 1;
  isFaved = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicesService: ServicesService,
    private authService: AuthService,
    public themeService: CustomizerSettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.loading = false; return; }
    this.loadService(slug);
  }

  loadService(slug: string): void {
    this.loading = true;
    this.servicesService.getServiceBySlug(slug).subscribe({
      next: (s) => {
        this.service = s;
        this.serviceImages = s.images?.length ? s.images : [];
        this.activeImage = this.serviceImages[0] ?? '';
        this.serviceTags = s.tags
          ? s.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];
        this.loading = false;
        this.loadAddOns(s.id);
      },
      error: (err) => {
        console.error('Error loading service:', err);
        this.loading = false;
      }
    });
  }

  loadAddOns(serviceId: number): void {
    this.servicesService.getAddOnsByService(serviceId).subscribe({
      next: (list) => { this.addOns = list.map(a => ({ ...a, selected: false })); },
      error: (err) => console.error('Error loading add-ons:', err)
    });
  }

  get addOnsTotal(): number {
    return this.addOns.filter(a => a.selected).reduce((s, a) => s + a.price, 0);
  }

  get subtotal(): number {
    return ((this.service?.price ?? 0) + this.addOnsTotal) * this.quantity;
  }

  get platformFee(): number {
    return Math.round(this.subtotal * 0.05 * 100) / 100;
  }

  get grandTotal(): number {
    return this.subtotal + this.platformFee;
  }

  get totalDeliveryDays(): number {
    const base = this.service?.deliveryTimeDays ?? this.service?.deliveryDays ?? 0;
    const extra = this.addOns
      .filter(a => a.selected)
      .reduce((s, a) => s + (a.extraDeliveryDays ?? 0), 0);
    return base + extra;
  }

  toggleAddon(addon: ServiceAddOn & { selected?: boolean }): void {
    addon.selected = !addon.selected;
  }

  updateQty(q: number): void { this.quantity = q; }

  removeImage(i: number): void {
    this.serviceImages.splice(i, 1);
    if (this.activeImage === this.serviceImages[i]) {
      this.activeImage = this.serviceImages[0] ?? '';
    }
  }

  hideReviewAvatar(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  toggleFav(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/front/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.isFaved = !this.isFaved;
    this.snackBar.open(
      this.isFaved ? 'Added to favourites' : 'Removed from favourites',
      'Close', { duration: 2500 }
    );
  }

  contactFreelancer(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/front/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.router.navigate(['/front/messages']);
  }

  continueToOrder(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/front/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    const addOnIds = this.addOns.filter(a => a.selected).map(a => a.id).join(',');
    this.router.navigate(['/front/checkout'], {
      queryParams: {
        serviceId: this.service?.id,
        quantity: this.quantity,
        ...(addOnIds ? { addOns: addOnIds } : {})
      }
    });
  }

  requestCustomOffer(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/front/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    const ref = this.dialog.open(CustomOfferDialogComponent, {
      width: '480px',
      panelClass: 'addon-dialog-panel'
    });
    ref.afterClosed().subscribe((result: CreateCustomOfferRequest | undefined) => {
      if (!result || !this.service) return;
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const offer: CreateCustomOfferRequest = {
        senderId:       currentUser.id,
        receiverId:     this.service.shopId,
        serviceId:      this.service.id,
        title:          result.title,
        description:    result.description,
        price:          result.price,
        deliveryDays:   result.deliveryTimeDays ?? 7,
        deliveryTimeDays: result.deliveryTimeDays ?? 7,
      };
      this.servicesService.createCustomOffer(offer).subscribe({
        next: () => this.snackBar.open('Custom offer request sent!', 'Close', { duration: 3500 }),
        error: () => this.snackBar.open('Failed to send request. Try again.', 'Close', { duration: 3000 })
      });
    });
  }

  getRatingPct(stars: number): number {
    const dist: Record<number, number> = { 5: 70, 4: 20, 3: 5, 2: 3, 1: 2 };
    return dist[stars] ?? 0;
  }

  getRatingCount(stars: number): number {
    return Math.round((this.service?.reviewCount ?? 0) * (this.getRatingPct(stars) / 100));
  }
}