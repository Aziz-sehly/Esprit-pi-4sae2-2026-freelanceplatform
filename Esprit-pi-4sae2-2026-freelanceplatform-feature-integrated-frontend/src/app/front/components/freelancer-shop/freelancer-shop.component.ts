import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Shop, FreelancerService, ServicesService, CreateServiceRequest } from '../../services/services.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-freelancer-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  styles: [`
    :host { display: block; }

    /* ── Page shell ── */
    .shop-page {
      font-family: 'Satoshi', 'Segoe UI', system-ui, sans-serif;
      background: transparent;
      padding-bottom: 0;
    }

    /* ── Hero banner ── */
    .shop-hero {
      background: linear-gradient(135deg, #1a0a1f 0%, #3b0764 40%, #6d28d9 100%);
      padding: 0;
      position: relative;
      overflow: hidden;
    }
    .shop-hero-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      opacity: .22;
    }
    .shop-hero-inner {
      position: relative; z-index: 2;
      padding: 28px 24px 20px;
      display: flex; align-items: center; gap: 20px;
      flex-wrap: wrap;
    }
    .shop-logo-wrap {
      width: 72px; height: 72px; border-radius: 14px;
      overflow: hidden; flex-shrink: 0;
      border: 3px solid rgba(255,255,255,.3);
      background: rgba(255,255,255,.1);
      display: flex; align-items: center; justify-content: center;
    }
    .shop-logo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .shop-logo-ph { font-size: 30px; line-height: 1; }
    .shop-hero-text { flex: 1; min-width: 0; }
    .shop-hero-text h1 {
      margin: 0 0 4px; color: #fff;
      font-size: 20px; font-weight: 800;
    }
    .shop-tagline { margin: 0 0 4px; color: rgba(255,255,255,.75); font-size: 13px; font-style: italic; }
    .shop-hero-desc { margin: 0; color: rgba(255,255,255,.65); font-size: 12px; line-height: 1.5; max-width: 480px; }
    .shop-hero-actions { display: flex; gap: 10px; flex-shrink: 0; }
    .btn-hero-edit {
      background: rgba(255,255,255,.15); color: #fff;
      border: 1px solid rgba(255,255,255,.3); border-radius: 9px;
      padding: 8px 16px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .15s; white-space: nowrap;
      display: flex; align-items: center; gap: 6px;
      text-decoration: none;
    }
    .btn-hero-edit:hover { background: rgba(255,255,255,.25); color: #fff; }

    /* ── Stats strip ── */
    .stats-strip {
      display: grid; grid-template-columns: repeat(4, 1fr);
      background: rgba(255,255,255,.06); border-top: 1px solid rgba(255,255,255,.1);
    }
    .stat-item {
      padding: 12px 16px; text-align: center;
      border-right: 1px solid rgba(255,255,255,.1);
    }
    .stat-item:last-child { border-right: none; }
    .stat-v { font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
    .stat-l { font-size: 10px; color: rgba(255,255,255,.6); margin-top: 3px; text-transform: uppercase; letter-spacing: .5px; }

    /* ── Body ── */
    .shop-body { padding: 20px 20px 4px; background: #fff; }

    /* ── Section header ── */
    .sec-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .sec-title { font-size: 16px; font-weight: 800; color: #111827; margin: 0; }
    .btn-add {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 9px;
      padding: 8px 16px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      transition: opacity .15s; flex-shrink: 0;
    }
    .btn-add:hover { opacity: .9; }
    .btn-add i { font-size: 15px; }

    /* ── Category filter ── */
    .cat-filter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .cat-btn {
      padding: 5px 13px; border-radius: 20px;
      border: 1.5px solid #e5e7eb; background: #fff;
      color: #6b7280; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .cat-btn:hover { border-color: #6366f1; color: #6366f1; }
    .cat-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

    /* ── Services grid ── */
    .svc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }
    .svc-card {
      background: #fff; border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      transition: box-shadow .2s, transform .2s;
    }
    .svc-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-2px); }

    /* ── FIX: Service image — block layout, no position:absolute on img ── */
    .svc-img {
      position: relative;
      width: 100%;
      height: 160px;
      overflow: hidden;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    }
    .svc-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      /* NOTE: NOT position:absolute — that fights with the ng-template placeholder */
    }
    /* FIX: placeholder fills the full parent height */
    .svc-img-ph {
      width: 100%;
      height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    }
    .svc-img-ph i { font-size: 36px; color: #8b5cf6; opacity: .6; }

    .svc-status-badge {
      position: absolute; top: 8px; right: 8px;
      padding: 3px 9px; border-radius: 20px;
      font-size: 10px; font-weight: 700; letter-spacing: .3px;
      z-index: 2;
    }
    .s-active    { background: #dcfce7; color: #166534; }
    .s-draft     { background: #f3f4f6; color: #374151; }
    .s-submitted { background: #fef9c3; color: #854d0e; }
    .s-rejected  { background: #fee2e2; color: #991b1b; }
    .s-paused    { background: #e0f2fe; color: #075985; }

    .svc-body { padding: 12px 14px; }
    .svc-cat {
      font-size: 10px; color: #9ca3af; font-weight: 600;
      text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px;
    }
    .svc-title {
      font-size: 13.5px; font-weight: 700; color: #111827;
      margin: 0 0 5px; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .svc-desc {
      font-size: 12px; color: #6b7280; margin: 0 0 10px; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .svc-foot { display: flex; align-items: center; justify-content: space-between; }
    .svc-meta { display: flex; gap: 8px; font-size: 11px; color: #9ca3af; }
    .svc-meta span { display: flex; align-items: center; gap: 3px; }
    .svc-price { font-size: 15px; font-weight: 800; color: #6366f1; }

    /* Owner action buttons */
    .svc-actions { padding: 8px 14px; border-top: 1px solid #f3f4f6; display: flex; gap: 6px; }
    .act {
      width: 30px; height: 30px; border-radius: 7px; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; cursor: pointer; transition: all .15s; text-decoration: none;
    }
    .act.edit   { background: #ede9fe; color: #7c3aed; }
    .act.edit:hover { background: #ddd6fe; }
    .act.addon  { background: #dbeafe; color: #2563eb; }
    .act.addon:hover { background: #bfdbfe; }
    .act.submit { background: #dcfce7; color: #16a34a; }
    .act.submit:hover { background: #bbf7d0; }
    .act.pause  { background: #fef3c7; color: #d97706; }
    .act.pause:hover { background: #fde68a; }
    .act.del    { background: #fee2e2; color: #dc2626; }
    .act.del:hover { background: #fecaca; }
    .act.view   { background: #f3f4f6; color: #374151; }
    .act.view:hover { background: #e5e7eb; }

    /* ── Empty state ── */
    .svc-empty {
      text-align: center; padding: 40px 20px;
      background: #fafafa; border-radius: 12px;
      border: 2px dashed #e5e7eb; margin-bottom: 4px;
    }
    .svc-empty i { font-size: 36px; color: #d1d5db; display: block; margin-bottom: 10px; }
    .svc-empty p { color: #6b7280; font-size: 13px; margin: 0 0 14px; }
    .btn-empty {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 10px;
      padding: 10px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      transition: opacity .15s;
    }
    .btn-empty:hover { opacity: .9; }

    /* ── Loading ── */
    .loading-wrap { display: flex; justify-content: center; padding: 40px; }

    /* ── FIX: Inline create-service form alignment ──
       width:100% + box-sizing:border-box ensures the form fills its parent column
       without overflowing when embedded inside a card/tab panel.
       max-width caps it on very wide screens for readability.
       Do NOT use margin:auto here — that only works in full-page standalone context. ── */
    .create-form-wrap {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      background: #fff; border-radius: 14px;
      border: 1.5px solid #6366f1;
      box-shadow: 0 4px 20px rgba(99,102,241,.1);
      padding: 24px 28px;
      margin-bottom: 20px;
    }
    .cf-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .cf-title { font-size: 16px; font-weight: 800; color: #111827; margin: 0; }
    .cf-close {
      width: 30px; height: 30px; border-radius: 7px;
      background: #f3f4f6; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; color: #6b7280; transition: background .15s; flex-shrink: 0;
    }
    .cf-close:hover { background: #e5e7eb; }

    /* Step indicator */
    .cf-steps { display: flex; align-items: center; position: relative; margin-bottom: 24px; }
    .cf-step-track {
      position: absolute; bottom: 14px; left: 16px; right: 16px;
      height: 2px; background: #e5e7eb; z-index: 0;
    }
    .cf-step-fill { height: 100%; background: #6366f1; transition: width .3s ease; }
    .cf-step {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      cursor: pointer; padding: 0 20px; position: relative; z-index: 1;
    }
    .cf-dot {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid #d1d5db; background: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #9ca3af; transition: all .2s;
    }
    .cf-step.active .cf-dot { border-color: #6366f1; background: #6366f1; color: #fff; }
    .cf-step.done   .cf-dot { border-color: #10b981; background: #10b981; color: #fff; }
    .cf-step-lbl { font-size: 11px; color: #9ca3af; white-space: nowrap; }
    .cf-step.active .cf-step-lbl { color: #6366f1; font-weight: 600; }
    .cf-step.done   .cf-step-lbl { color: #6b7280; }

    /* Fields */
    .cf-field { margin-bottom: 16px; }
    .cf-field label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 5px; }
    .cf-req { color: #ef4444; }
    .cf-opt { font-weight: 400; color: #9ca3af; font-size: 11px; }
    .cf-input {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 8px;
      padding: 9px 12px; font-size: 13px; color: #111827;
      background: #fff; outline: none; box-sizing: border-box;
      font-family: inherit; transition: border-color .15s, box-shadow .15s;
    }
    .cf-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    .cf-input::placeholder { color: #c4c8d0; }
    .cf-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
    .cf-select {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 8px;
      padding: 9px 12px; font-size: 13px; color: #111827;
      background: #fff; outline: none; appearance: none;
      box-sizing: border-box; cursor: pointer; font-family: inherit;
    }
    .cf-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    .cf-hint { font-size: 11px; color: #9ca3af; margin-top: 4px; display: block; }

    /* FIX: 3-col grid for pricing — falls back to 2-col on narrow containers */
    .cf-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .cf-prefix-wrap { position: relative; }
    .cf-prefix {
      position: absolute; left: 11px; top: 50%;
      transform: translateY(-50%); color: #6b7280; font-size: 13px; pointer-events: none;
    }
    .cf-prefixed { padding-left: 22px; }

    /* Tag row */
    .cf-tag-row { display: flex; gap: 7px; }
    .cf-tag-input { flex: 1; min-width: 0; }
    .cf-tag-add {
      background: #6366f1; color: #fff; border: none; border-radius: 7px;
      padding: 0 13px; font-size: 12px; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: background .15s; flex-shrink: 0;
    }
    .cf-tag-add:hover { background: #4f46e5; }
    .cf-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
    .cf-tag-chip {
      background: #ede9fe; color: #6d28d9; border-radius: 20px;
      padding: 3px 9px; font-size: 11px; font-weight: 500;
      display: flex; align-items: center; gap: 4px;
    }
    .cf-tag-chip button {
      background: none; border: none; cursor: pointer;
      color: #7c3aed; font-size: 13px; padding: 0; line-height: 1;
    }
    .cf-tag-chip button:hover { color: #4c1d95; }

    /* Summary */
    .cf-summary {
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
    }
    .cf-summary h4 { margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #374151; }
    .cf-sum-row {
      display: flex; justify-content: space-between; font-size: 12.5px;
      color: #6b7280; padding: 5px 0; border-bottom: 1px solid #f3f4f6;
    }
    .cf-sum-row:last-child { border: none; }
    .cf-sum-row span:last-child { font-weight: 600; color: #111827; }
    .cf-price-val { color: #6366f1 !important; font-weight: 700 !important; }

    /* Actions */
    .cf-actions {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 16px; border-top: 1px solid #f3f4f6; margin-top: 18px;
    }
    .cf-btn-next {
      background: #6366f1; color: #fff; border: none; border-radius: 8px;
      padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background .15s;
    }
    .cf-btn-next:hover:not(:disabled) { background: #4f46e5; }
    .cf-btn-next:disabled { opacity: .45; cursor: not-allowed; }
    .cf-btn-back {
      background: #fff; color: #6b7280; border: 1.5px solid #e5e7eb;
      border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s;
    }
    .cf-btn-back:hover { border-color: #9ca3af; color: #374151; }
    .cf-btn-save {
      background: #10b981; color: #fff; border: none; border-radius: 8px;
      padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background .15s;
    }
    .cf-btn-save:hover:not(:disabled) { background: #059669; }
    .cf-btn-save:disabled { opacity: .45; cursor: not-allowed; }

    /* ── No-shop state ── */
    .no-shop { text-align: center; padding: 40px 24px; background: #fff; }
    .no-shop-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
    }
    .no-shop-icon i { font-size: 28px; color: #7c3aed; }
    .no-shop h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 6px; }
    .no-shop p { color: #6b7280; font-size: 13px; margin: 0 0 18px; line-height: 1.6; }
    .btn-create-shop {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 10px;
      padding: 11px 24px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
      transition: opacity .2s; text-decoration: none;
    }
    .btn-create-shop:hover { opacity: .9; color: #fff; }

    @media (max-width: 640px) {
      /* FIX: pricing grid becomes 2-col on small screens */
      .cf-grid3 { grid-template-columns: 1fr 1fr; }
      .stats-strip { grid-template-columns: repeat(2, 1fr); }
      .shop-hero-inner { padding: 20px 14px 16px; }
      .create-form-wrap { padding: 18px 14px; }
      .svc-grid { grid-template-columns: 1fr; }
      /* step labels hidden on very small screens to avoid overflow */
      .cf-step-lbl { display: none; }
    }

    @media (max-width: 400px) {
      .cf-grid3 { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <!-- ── Loading ── -->
    <div class="loading-wrap" *ngIf="loadingShop">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <!-- ── No shop (owner) ── -->
    <div class="no-shop" *ngIf="!loadingShop && !shop && isOwner">
      <div class="no-shop-icon"><i class="ri-store-3-line"></i></div>
      <h2>You don't have a shop yet</h2>
      <p>Create your freelancer shop to start offering services and reaching clients worldwide.</p>
      <a routerLink="/front/my-shop" class="btn-create-shop">
        <i class="ri-add-line"></i> Create My Shop
      </a>
    </div>

    <!-- ── No shop (visitor) ── -->
    <div class="no-shop" *ngIf="!loadingShop && !shop && !isOwner">
      <div class="no-shop-icon"><i class="ri-store-3-line"></i></div>
      <h2>No shop found</h2>
      <p>This freelancer hasn't set up their shop yet.</p>
    </div>

    <!-- ── Has shop ── -->
    <div class="shop-page" *ngIf="!loadingShop && shop">

      <!-- Hero banner -->
      <div class="shop-hero">
        <div class="shop-hero-bg"
             *ngIf="shop.bannerUrl"
             [style.background-image]="'url(' + shop.bannerUrl + ')'"></div>
        <div class="shop-hero-inner">
          <div class="shop-logo-wrap">
            <!-- FIX: gate img on avatarUrl, show emoji placeholder otherwise -->
            <img *ngIf="shop.avatarUrl" [src]="shop.avatarUrl" alt="Shop logo"
                 (error)="onImgError($event)">
            <span *ngIf="!shop.avatarUrl" class="shop-logo-ph">🏪</span>
          </div>
          <div class="shop-hero-text">
            <h1>{{ shop.shopName }}</h1>
            <p class="shop-tagline" *ngIf="shop.tagline">"{{ shop.tagline }}"</p>
            <p class="shop-hero-desc" *ngIf="shop.description">
              {{ shop.description | slice:0:140 }}{{ (shop.description?.length ?? 0) > 140 ? '...' : '' }}
            </p>
          </div>
          <div class="shop-hero-actions" *ngIf="isOwner">
            <a routerLink="/front/my-shop" class="btn-hero-edit">
              <i class="ri-settings-line"></i> Manage Shop
            </a>
          </div>
        </div>
        <!-- Stats strip -->
        <div class="stats-strip">
          <div class="stat-item">
            <div class="stat-v">{{ activeCount }}</div>
            <div class="stat-l">Active</div>
          </div>
          <div class="stat-item">
            <div class="stat-v">{{ services.length }}</div>
            <div class="stat-l">Total Services</div>
          </div>
          <div class="stat-item">
            <div class="stat-v">{{ avgRating }}</div>
            <div class="stat-l">Avg Rating</div>
          </div>
          <div class="stat-item">
            <div class="stat-v">{{ totalOrders }}</div>
            <div class="stat-l">Orders Done</div>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="shop-body">

        <!-- Section header -->
        <div class="sec-header">
          <h2 class="sec-title">
            {{ isOwner ? 'My Services' : 'Services' }}
            <span style="font-size:13px;font-weight:400;color:#9ca3af;margin-left:6px">({{ filteredServices.length }})</span>
          </h2>
          <button class="btn-add" *ngIf="isOwner" (click)="toggleCreateForm()">
            <i [class]="showCreateForm ? 'ri-close-line' : 'ri-add-line'"></i>
            {{ showCreateForm ? 'Cancel' : 'Add Service' }}
          </button>
        </div>

        <!-- ── INLINE CREATE / EDIT FORM ── -->
        <div class="create-form-wrap" *ngIf="showCreateForm">
          <div class="cf-header">
            <h3 class="cf-title">{{ editingServiceId ? 'Edit Service' : 'Create New Service' }}</h3>
            <button class="cf-close" (click)="toggleCreateForm()" type="button">✕</button>
          </div>

          <!-- Step indicator -->
          <div class="cf-steps">
            <div class="cf-step-track">
              <div class="cf-step-fill" [style.width.%]="((formStep - 1) / 2) * 100"></div>
            </div>
            <div class="cf-step" *ngFor="let s of formSteps; let i = index"
                 [class.active]="formStep === i + 1"
                 [class.done]="formStep > i + 1"
                 (click)="goToFormStep(i + 1)">
              <div class="cf-dot">
                <i class="ri-check-line" *ngIf="formStep > i + 1"></i>
                <span *ngIf="formStep <= i + 1">{{ i + 1 }}</span>
              </div>
              <span class="cf-step-lbl">{{ s }}</span>
            </div>
          </div>

          <!-- Step 1: Overview -->
          <ng-container *ngIf="formStep === 1">
            <div class="cf-field">
              <label>Service Title <span class="cf-req">*</span></label>
              <input class="cf-input" [(ngModel)]="fd.title" maxlength="80"
                     placeholder="e.g. I will design a professional logo for your brand" />
              <span class="cf-hint">{{ fd.title?.length || 0 }}/80 · min 10 chars</span>
            </div>
            <div class="cf-field">
              <label>Category <span class="cf-req">*</span></label>
              <select class="cf-select" [(ngModel)]="fd.category">
                <option value="">Select a category</option>
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div class="cf-field">
              <label>Description <span class="cf-req">*</span></label>
              <textarea class="cf-input cf-textarea" [(ngModel)]="fd.description"
                        maxlength="2000" rows="5"
                        placeholder="Describe what the client gets, your process, expertise..."></textarea>
              <span class="cf-hint">{{ fd.description?.length || 0 }}/2000 · min 50 chars</span>
            </div>
            <div class="cf-field">
              <label>Tags <span class="cf-opt">(optional)</span></label>
              <div class="cf-tag-row">
                <input class="cf-input cf-tag-input" [(ngModel)]="tagInput"
                       placeholder="e.g. logo, branding" (keyup.enter)="addTag()" />
                <button class="cf-tag-add" (click)="addTag()" type="button">Add</button>
              </div>
              <div class="cf-tags" *ngIf="tags.length">
                <span class="cf-tag-chip" *ngFor="let t of tags; let i = index">
                  {{ t }}
                  <button (click)="removeTag(i)" type="button">×</button>
                </span>
              </div>
            </div>
            <div class="cf-actions">
              <span></span>
              <button class="cf-btn-next" (click)="nextFormStep()" [disabled]="!step1Valid()">
                Continue <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </ng-container>

          <!-- Step 2: Pricing -->
          <ng-container *ngIf="formStep === 2">
            <div class="cf-grid3">
              <div class="cf-field">
                <label>Price (USD) <span class="cf-req">*</span></label>
                <div class="cf-prefix-wrap">
                  <span class="cf-prefix">$</span>
                  <input class="cf-input cf-prefixed" type="number" [(ngModel)]="fd.price" min="1" placeholder="50" />
                </div>
              </div>
              <div class="cf-field">
                <label>Delivery Days <span class="cf-req">*</span></label>
                <input class="cf-input" type="number" [(ngModel)]="fd.deliveryTimeDays" min="1" max="90" placeholder="3" />
              </div>
              <div class="cf-field">
                <label>Revisions <span class="cf-req">*</span></label>
                <input class="cf-input" type="number" [(ngModel)]="fd.revisionCount" min="0" max="10" placeholder="2" />
              </div>
            </div>
            <div class="cf-field">
              <label>Buyer Requirements <span class="cf-opt">(optional)</span></label>
              <textarea class="cf-input cf-textarea" [(ngModel)]="fd.requirementsDescription" rows="3"
                        placeholder="What info do you need from the client to start?"></textarea>
            </div>
            <div class="cf-actions">
              <button class="cf-btn-back" (click)="prevFormStep()" type="button">
                <i class="ri-arrow-left-line"></i> Back
              </button>
              <button class="cf-btn-next" (click)="nextFormStep()" [disabled]="!step2Valid()">
                Continue <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </ng-container>

          <!-- Step 3: Media + Review -->
          <ng-container *ngIf="formStep === 3">
            <div class="cf-field">
              <label>Image URLs <span class="cf-opt">(optional)</span></label>
              <textarea class="cf-input cf-textarea" [(ngModel)]="fd.mediaUrls" rows="3"
                        placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"></textarea>
              <span class="cf-hint">Comma-separated. Recommended: 1200×800px or larger.</span>
            </div>

            <div class="cf-summary" *ngIf="step1Valid() && step2Valid()">
              <h4>Summary</h4>
              <div class="cf-sum-row">
                <span>Title</span>
                <span>{{ fd.title | slice:0:40 }}{{ fd.title.length > 40 ? '…' : '' }}</span>
              </div>
              <div class="cf-sum-row"><span>Category</span><span>{{ fd.category }}</span></div>
              <div class="cf-sum-row">
                <span>Price</span>
                <span class="cf-price-val">\${{ fd.price }}</span>
              </div>
              <div class="cf-sum-row"><span>Delivery</span><span>{{ fd.deliveryTimeDays }} days</span></div>
              <div class="cf-sum-row"><span>Revisions</span><span>{{ fd.revisionCount }}</span></div>
            </div>

            <div class="cf-actions">
              <button class="cf-btn-back" (click)="prevFormStep()" type="button">
                <i class="ri-arrow-left-line"></i> Back
              </button>
              <button class="cf-btn-save" (click)="saveService()" type="button"
                      [disabled]="formLoading || !step1Valid() || !step2Valid()">
                <mat-spinner diameter="14" *ngIf="formLoading"></mat-spinner>
                <i class="ri-check-line" *ngIf="!formLoading"></i>
                {{ editingServiceId ? 'Update Service' : 'Create Service' }}
              </button>
            </div>
          </ng-container>
        </div>
        <!-- ── END INLINE FORM ── -->

        <!-- Category filter -->
        <div class="cat-filter" *ngIf="!loadingServices && services.length > 0">
          <button class="cat-btn" [class.active]="activeCategory === 'all'" (click)="filterCat('all')">All</button>
          <button class="cat-btn" *ngFor="let c of uniqueCategories"
                  [class.active]="activeCategory === c"
                  (click)="filterCat(c)">{{ c }}</button>
        </div>

        <!-- Loading services -->
        <div class="loading-wrap" *ngIf="loadingServices">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <!-- Services grid -->
        <div class="svc-grid" *ngIf="!loadingServices && filteredServices.length > 0">
          <div class="svc-card" *ngFor="let s of filteredServices">

            <!--
              FIX: Image rendering
              1. ng-container with "as" alias gates the img on a real URL
              2. ng-template #imgPh renders when getServiceImage returns null
              3. onSvcImgError injects a .svc-img-ph div into the DOM on broken URLs
                 (because Angular won't re-evaluate the *ngIf after first render)
            -->
            <div class="svc-img">
              <ng-container *ngIf="getServiceImage(s) as imgSrc; else imgPh">
                <img [src]="imgSrc" [alt]="s.title" (error)="onSvcImgError($event)">
              </ng-container>
              <ng-template #imgPh>
                <div class="svc-img-ph"><i class="ri-image-line"></i></div>
              </ng-template>
              <span class="svc-status-badge" [ngClass]="statusClass(s.status)">
                {{ formatStatus(s.status) }}
              </span>
            </div>

            <div class="svc-body">
              <div class="svc-cat">{{ s.category }}</div>
              <h4 class="svc-title">{{ s.title }}</h4>
              <p class="svc-desc">{{ s.description }}</p>
              <div class="svc-foot">
                <div class="svc-meta">
                  <span><i class="ri-time-line"></i>{{ s.deliveryTimeDays ?? s.deliveryDays }}d</span>
                  <span><i class="ri-refresh-line"></i>{{ s.revisionCount ?? 0 }}rev</span>
                </div>
                <span class="svc-price">\${{ s.price }}</span>
              </div>
            </div>

            <!-- Owner actions -->
            <div class="svc-actions" *ngIf="isOwner">
              <button class="act edit" (click)="startEdit(s)" title="Edit">
                <i class="ri-edit-line"></i>
              </button>
              <a class="act addon" [routerLink]="['/front/services', s.id, 'addons']" title="Add-ons">
                <i class="ri-add-circle-line"></i>
              </a>
              <button class="act submit" *ngIf="s.status === 'DRAFT' || s.status === 'REJECTED'"
                      (click)="submitForReview(s)" title="Submit for review">
                <i class="ri-send-plane-line"></i>
              </button>
              <button class="act pause" *ngIf="s.status === 'ACTIVE' || s.status === 'PAUSED'"
                      (click)="togglePause(s)" [title]="s.status === 'ACTIVE' ? 'Pause' : 'Activate'">
                <i [class]="s.status === 'ACTIVE' ? 'ri-pause-line' : 'ri-play-line'"></i>
              </button>
              <button class="act del" (click)="deleteService(s)" title="Delete">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>

            <!-- Visitor: view link -->
            <div class="svc-actions" *ngIf="!isOwner && s.status === 'ACTIVE'">
              <a class="act view" [routerLink]="['/front/services', s.slug]"
                 style="width:auto;padding:0 12px;gap:5px;">
                <i class="ri-eye-line"></i> View Service
              </a>
            </div>

          </div>
        </div>

        <!-- Empty -->
        <div class="svc-empty" *ngIf="!loadingServices && filteredServices.length === 0 && !showCreateForm">
          <i class="ri-stack-line"></i>
          <p *ngIf="isOwner">No services yet. Add your first one above.</p>
          <p *ngIf="!isOwner">This freelancer hasn't added any services yet.</p>
          <button class="btn-empty" *ngIf="isOwner" (click)="toggleCreateForm()">
            <i class="ri-add-line"></i> Create First Service
          </button>
        </div>

      </div><!-- /shop-body -->
    </div><!-- /shop-page -->
  `
})
export class FreelancerShopComponent implements OnInit, OnChanges {
  @Input() freelancerId!: number;
  @Input() isOwner = false;

  shop: Shop | null = null;
  services: FreelancerService[] = [];
  filteredServices: FreelancerService[] = [];
  activeCategory = 'all';
  loadingShop = true;
  loadingServices = false;

  // Stats
  get activeCount() { return this.services.filter(s => s.status === 'ACTIVE').length; }
  get avgRating(): string {
    const rated = this.services.filter(s => s.rating > 0);
    if (!rated.length) return '—';
    return (rated.reduce((s, x) => s + x.rating, 0) / rated.length).toFixed(1);
  }
  get totalOrders() { return this.services.reduce((s, x) => s + (x.orderCount || 0), 0); }
  get uniqueCategories() { return [...new Set(this.services.map(s => s.category))]; }

  // Inline form state
  showCreateForm = false;
  editingServiceId: number | null = null;
  formStep = 1;
  formLoading = false;
  formSteps = ['Overview', 'Pricing', 'Media'];

  fd: CreateServiceRequest = this.blankForm();
  tagInput = '';
  tags: string[] = [];

  categories = [
    'Design', 'Development', 'Marketing', 'Writing',
    'Video & Animation', 'Music & Audio', 'Programming & Tech',
    'Business', 'Lifestyle', 'Data'
  ];

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.freelancerId) {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        this.freelancerId = Number(idParam);
        const me = this.authService.getCurrentUser();
        this.isOwner = me?.id === this.freelancerId && me?.role === 'FREELANCER';
      }
    }
    if (this.freelancerId) this.loadShop();
    else { this.loadingShop = false; }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['freelancerId'] && !changes['freelancerId'].firstChange) {
      this.loadShop();
    }
  }

  loadShop(): void {
    this.loadingShop = true;
    this.servicesService.getShopByFreelancer(this.freelancerId).subscribe({
      next: (shop) => {
        this.shop = shop;
        this.loadingShop = false;
        this.loadServices(shop.id);
      },
      error: () => { this.shop = null; this.loadingShop = false; }
    });
  }

  loadServices(shopId: number): void {
    this.loadingServices = true;
    this.servicesService.getServicesByShop(shopId).subscribe({
      next: (svcs) => {
        this.services = this.isOwner ? svcs : svcs.filter(s => s.status === 'ACTIVE');
        this.applyFilter();
        this.loadingServices = false;
      },
      error: () => { this.loadingServices = false; }
    });
  }

  filterCat(cat: string): void {
    this.activeCategory = cat;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredServices = this.activeCategory === 'all'
      ? [...this.services]
      : this.services.filter(s => s.category === this.activeCategory);
  }

  // ── Image helpers ──────────────────────────────────────────────────────────

  /**
   * FIX: Returns the first valid image URL, or null if none exists.
   * Returning null (not a fallback path) is what allows *ngIf="getServiceImage(s) as imgSrc"
   * to correctly gate the <img> and fall through to ng-template #imgPh.
   *
   * Priority:
   * 1. s.images[] — populated by normaliseService() in ServicesService
   * 2. s.mediaUrls string — direct fallback parse
   */
  getServiceImage(s: FreelancerService): string | null {
    if (s.images && s.images.length > 0 && s.images[0]?.trim()) {
      return s.images[0].trim();
    }
    if (s.mediaUrls) {
      const first = s.mediaUrls.split(',')[0].trim();
      if (first) return first;
    }
    return null;
  }

  /**
   * FIX: When a URL resolves but the image fails to load (404, CORS, etc.),
   * Angular has already committed to rendering the <img> branch of the *ngIf —
   * it won't switch to ng-template #imgPh. So we hide the broken img and
   * inject a placeholder div directly into the same parent wrapper.
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

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  // ── Owner service actions ──────────────────────────────────────────────────

  submitForReview(s: FreelancerService): void {
    this.servicesService.submitForReview(s.id).subscribe({
      next: (u) => { s.status = u.status; this.snackBar.open('Submitted for review!', 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to submit', 'Close', { duration: 3000 })
    });
  }

  togglePause(s: FreelancerService): void {
    this.servicesService.togglePause(s.id).subscribe({
      next: (u) => {
        s.status = u.status;
        this.snackBar.open(u.status === 'PAUSED' ? 'Paused' : 'Activated', 'Close', { duration: 3000 });
        this.applyFilter();
      },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 })
    });
  }

  deleteService(s: FreelancerService): void {
    if (!confirm('Delete "' + s.title + '"? This cannot be undone.')) return;
    this.servicesService.deleteService(s.id).subscribe({
      next: () => {
        this.services = this.services.filter(x => x.id !== s.id);
        this.applyFilter();
        this.snackBar.open('Service deleted.', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to delete.', 'Close', { duration: 3000 })
    });
  }

  // ── Inline form ────────────────────────────────────────────────────────────

  blankForm(): CreateServiceRequest {
    return {
      title: '', description: '', price: 0, deliveryTimeDays: 3,
      revisionCount: 2, category: '', tags: '', mediaUrls: '', requirementsDescription: ''
    };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    } else {
      this.formStep = 1;
      setTimeout(() => {
        const el = document.querySelector('.create-form-wrap');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  startEdit(s: FreelancerService): void {
    this.editingServiceId = s.id;
    this.fd = {
      title:                   s.title,
      description:             s.description,
      price:                   s.price,
      deliveryTimeDays:        s.deliveryTimeDays ?? s.deliveryDays ?? 3,
      revisionCount:           s.revisionCount ?? 0,
      category:                s.category,
      tags:                    s.tags || '',
      mediaUrls:               s.mediaUrls || '',
      requirementsDescription: s.requirementsDescription || ''
    };
    this.tags = s.tags ? s.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    this.showCreateForm = true;
    this.formStep = 1;
    setTimeout(() => {
      const el = document.querySelector('.create-form-wrap');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  resetForm(): void {
    this.fd = this.blankForm();
    this.tags = [];
    this.tagInput = '';
    this.formStep = 1;
    this.editingServiceId = null;
  }

  step1Valid(): boolean {
    return !!(
      this.fd.title && this.fd.title.length >= 10 &&
      this.fd.category &&
      this.fd.description && this.fd.description.length >= 50
    );
  }

  step2Valid(): boolean {
    return !!(
      this.fd.price > 0 &&
      this.fd.deliveryTimeDays > 0 &&
      (this.fd.revisionCount ?? 0) >= 0
    );
  }

  goToFormStep(n: number): void {
    if (n < this.formStep ||
        (n === 2 && this.step1Valid()) ||
        (n === 3 && this.step1Valid() && this.step2Valid())) {
      this.formStep = n;
    }
  }

  nextFormStep(): void { if (this.formStep < 3) this.formStep++; }
  prevFormStep(): void { if (this.formStep > 1) this.formStep--; }

  addTag(): void {
    const t = this.tagInput.trim();
    if (t && !this.tags.includes(t) && this.tags.length < 10) {
      this.tags.push(t);
      this.tagInput = '';
      this.fd.tags = this.tags.join(', ');
    }
  }

  removeTag(i: number): void {
    this.tags.splice(i, 1);
    this.fd.tags = this.tags.join(', ');
  }

  saveService(): void {
    if (!this.shop) { this.snackBar.open('Shop not found', 'Close', { duration: 3000 }); return; }
    this.formLoading = true;
    const call = this.editingServiceId
      ? this.servicesService.updateService(this.editingServiceId, this.fd)
      : this.servicesService.createService(this.shop.id, this.fd);

    call.subscribe({
      next: () => {
        this.formLoading = false;
        this.showCreateForm = false;
        const msg = this.editingServiceId
          ? 'Service updated!'
          : 'Service created! Submit it for review when ready.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
        this.resetForm();
        this.loadServices(this.shop!.id);
      },
      error: (e) => {
        this.formLoading = false;
        this.snackBar.open(e?.error?.message || 'Failed to save service.', 'Close', { duration: 3000 });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatStatus(s: string): string {
    if (s === 'SUBMITTED') return 'Pending';
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      ACTIVE: 's-active', DRAFT: 's-draft', SUBMITTED: 's-submitted',
      REJECTED: 's-rejected', PAUSED: 's-paused', ARCHIVED: 's-draft'
    };
    return m[s] ?? 's-draft';
  }
}