import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateServiceRequest, ServicesService } from '../../services/services.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <!-- Header -->
    <div class="sf-header">
      <div class="sf-header-left">
        <a routerLink="/front/my-shop" class="sf-back">
          <i class="ri-arrow-left-line"></i>
        </a>
        <div>
          <h1 class="sf-title">{{ isEditMode ? 'Edit Service' : 'Create Service' }}</h1>
          <p class="sf-subtitle">{{ stepSubtitles[currentStep - 1] }}</p>
        </div>
      </div>
      <div class="sf-steps">
        <div class="sf-step" *ngFor="let s of steps; let i = index"
             [class.active]="currentStep === i + 1"
             [class.done]="currentStep > i + 1"
             (click)="goToStep(i + 1)">
          <div class="sf-step-dot">
            <i class="ri-check-line" *ngIf="currentStep > i + 1"></i>
            <span *ngIf="currentStep <= i + 1">{{ i + 1 }}</span>
          </div>
          <span class="sf-step-label">{{ s }}</span>
        </div>
        <div class="sf-step-track">
          <div class="sf-step-fill" [style.width.%]="((currentStep - 1) / 2) * 100"></div>
        </div>
      </div>
    </div>

    <!-- No shop warning -->
    <div class="sf-warn" *ngIf="!shopId && !isEditMode">
      <i class="ri-alert-line"></i>
      You need a shop before adding services.
      <a routerLink="/front/my-shop">Create one →</a>
    </div>

    <div class="sf-body" *ngIf="shopId || isEditMode">

      <!-- ── Step 1: Overview ── -->
      <div class="sf-panel" *ngIf="currentStep === 1">
        <div class="sf-field">
          <label>Service Title <span class="req">*</span></label>
          <input [(ngModel)]="serviceData.title" maxlength="80"
                 placeholder="e.g. I will design a professional logo for your business"
                 class="sf-input" />
          <span class="sf-hint">{{ serviceData.title?.length || 0 }}/80 · minimum 10 characters</span>
        </div>

        <div class="sf-field">
          <label>Category <span class="req">*</span></label>
          <select [(ngModel)]="serviceData.category" class="sf-select">
            <option value="">Select a category</option>
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>
        </div>

        <div class="sf-field">
          <label>Description <span class="req">*</span></label>
          <textarea [(ngModel)]="serviceData.description" maxlength="2000" rows="6"
                    class="sf-input sf-textarea"
                    placeholder="Describe your service — what the client gets, your process, your expertise..."></textarea>
          <span class="sf-hint">{{ serviceData.description?.length || 0 }}/2000 · minimum 50 characters</span>
        </div>

        <div class="sf-field">
          <label>Tags <span class="sf-optional">(optional)</span></label>
          <div class="sf-tag-row">
            <input [(ngModel)]="tagInput" class="sf-input sf-tag-input"
                   placeholder="e.g. logo, branding, design"
                   (keyup.enter)="addTag()" />
            <button class="sf-btn-tag" (click)="addTag()" type="button">Add</button>
          </div>
          <div class="sf-tags" *ngIf="tags.length">
            <span class="sf-tag" *ngFor="let t of tags; let i = index">
              {{ t }}
              <button (click)="removeTag(i)" type="button">×</button>
            </span>
          </div>
        </div>

        <div class="sf-actions">
          <span></span>
          <button class="sf-btn-primary" (click)="nextStep()" [disabled]="!step1Valid()">
            Continue <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 2: Pricing ── -->
      <div class="sf-panel" *ngIf="currentStep === 2">
        <div class="sf-row-3">
          <div class="sf-field">
            <label>Price (USD) <span class="req">*</span></label>
            <div class="sf-prefix-wrap">
              <span class="sf-prefix">$</span>
              <input [(ngModel)]="serviceData.price" type="number" min="5"
                     class="sf-input sf-prefixed" placeholder="50" />
            </div>
          </div>
          <div class="sf-field">
            <label>Delivery Days <span class="req">*</span></label>
            <input [(ngModel)]="serviceData.deliveryTimeDays" type="number" min="1" max="90"
                   class="sf-input" placeholder="3" />
          </div>
          <div class="sf-field">
            <label>Revisions <span class="req">*</span></label>
            <input [(ngModel)]="serviceData.revisionCount" type="number" min="0" max="10"
                   class="sf-input" placeholder="2" />
          </div>
        </div>

        <div class="sf-field">
          <label>Buyer Requirements <span class="sf-optional">(optional)</span></label>
          <textarea [(ngModel)]="serviceData.requirementsDescription" rows="3"
                    class="sf-input sf-textarea"
                    placeholder="What do you need from the client to get started? e.g. Company name, brand colors..."></textarea>
        </div>

        <div class="sf-actions">
          <button class="sf-btn-secondary" (click)="prevStep()">
            <i class="ri-arrow-left-line"></i> Back
          </button>
          <button class="sf-btn-primary" (click)="nextStep()" [disabled]="!step2Valid()">
            Continue <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 3: Media ── -->
      <div class="sf-panel" *ngIf="currentStep === 3">
        <div class="sf-field">
          <label>Image URLs <span class="sf-optional">(optional)</span></label>
          <textarea [(ngModel)]="serviceData.mediaUrls" rows="3"
                    class="sf-input sf-textarea"
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"></textarea>
          <span class="sf-hint">Comma-separated URLs. Recommended: 1200×800px or larger.</span>
        </div>

        <div class="sf-preview" *ngIf="previewImages.length">
          <img *ngFor="let img of previewImages" [src]="img" (error)="onImgError($event)" />
        </div>
        <button class="sf-btn-ghost" type="button"
                (click)="previewImages = parseImages()"
                *ngIf="serviceData.mediaUrls">
          <i class="ri-eye-line"></i> Preview Images
        </button>

        <!-- Summary -->
        <div class="sf-summary" *ngIf="step1Valid() && step2Valid()">
          <h4>Summary</h4>
          <div class="sf-summary-row">
            <span>Title</span>
            <span>{{ serviceData.title | slice:0:45 }}{{ serviceData.title.length > 45 ? '…' : '' }}</span>
          </div>
          <div class="sf-summary-row">
            <span>Category</span>
            <span>{{ serviceData.category }}</span>
          </div>
          <div class="sf-summary-row">
            <span>Price</span>
            <span class="sf-summary-price">\${{ serviceData.price }}</span>
          </div>
          <div class="sf-summary-row">
            <span>Delivery</span>
            <span>{{ serviceData.deliveryTimeDays }} days</span>
          </div>
          <div class="sf-summary-row">
            <span>Revisions</span>
            <span>{{ serviceData.revisionCount }}</span>
          </div>
        </div>

        <div class="sf-actions">
          <button class="sf-btn-secondary" (click)="prevStep()">
            <i class="ri-arrow-left-line"></i> Back
          </button>
          <button class="sf-btn-submit" (click)="saveService()"
                  [disabled]="loading || !step1Valid() || !step2Valid()">
            <mat-spinner diameter="15" *ngIf="loading"></mat-spinner>
            <i class="ri-check-line" *ngIf="!loading"></i>
            {{ isEditMode ? 'Update Service' : 'Create Service' }}
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Layout ── */
    :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }

    .sf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 28px;
    }
    .sf-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .sf-back {
      width: 38px; height: 38px;
      border-radius: 10px;
      border: 1.5px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      color: #6b7280; text-decoration: none;
      transition: all .15s;
      flex-shrink: 0;
      &:hover { border-color: #6366f1; color: #6366f1; }
      i { font-size: 18px; }
    }
    .sf-title { margin: 0 0 2px; font-size: 20px; font-weight: 700; color: #111827; }
    .sf-subtitle { margin: 0; font-size: 13px; color: #9ca3af; }

    /* ── Steps ── */
    .sf-steps {
      display: flex;
      align-items: center;
      gap: 0;
      position: relative;
    }
    .sf-step-track {
      position: absolute;
      bottom: 14px;
      left: 16px;
      right: 16px;
      height: 2px;
      background: #e5e7eb;
      z-index: 0;
    }
    .sf-step-fill {
      height: 100%;
      background: #6366f1;
      transition: width .35s ease;
    }
    .sf-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }
    .sf-step-dot {
      width: 30px; height: 30px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      background: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: #9ca3af;
      transition: all .2s;
    }
    .sf-step.active .sf-step-dot {
      border-color: #6366f1;
      background: #6366f1;
      color: white;
    }
    .sf-step.done .sf-step-dot {
      border-color: #10b981;
      background: #10b981;
      color: white;
    }
    .sf-step-label {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      white-space: nowrap;
    }
    .sf-step.active .sf-step-label { color: #6366f1; font-weight: 600; }
    .sf-step.done .sf-step-label { color: #6b7280; }

    /* ── Warning ── */
    .sf-warn {
      background: #fef9c3;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #854d0e;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      i { font-size: 16px; }
      a { color: #6366f1; font-weight: 600; text-decoration: none; margin-left: 4px; }
    }

    /* ── Panel ── */
    .sf-body { max-width: 680px; }
    .sf-panel {
      background: white;
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
    }

    /* ── Fields ── */
    .sf-field {
      margin-bottom: 22px;
      label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 7px;
      }
    }
    .req { color: #ef4444; }
    .sf-optional { font-weight: 400; color: #9ca3af; font-size: 12px; }

    .sf-input {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      padding: 10px 13px;
      font-size: 14px;
      color: #111827;
      background: white;
      outline: none;
      transition: border-color .15s, box-shadow .15s;
      box-sizing: border-box;
      font-family: inherit;
      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,.1);
      }
      &::placeholder { color: #c4c8d0; }
    }
    .sf-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
    .sf-select {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      padding: 10px 13px;
      font-size: 14px;
      color: #111827;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%239ca3af' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") no-repeat right 13px center;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: border-color .15s;
      box-sizing: border-box;
      &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    }
    .sf-hint { font-size: 12px; color: #9ca3af; margin-top: 5px; display: block; }

    /* ── Tags ── */
    .sf-tag-row { display: flex; gap: 8px; }
    .sf-tag-input { flex: 1; }
    .sf-btn-tag {
      background: #6366f1; color: white; border: none; border-radius: 9px;
      padding: 0 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: background .15s; white-space: nowrap;
      &:hover { background: #4f46e5; }
    }
    .sf-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
    .sf-tag {
      background: #ede9fe; color: #6d28d9; border-radius: 20px;
      padding: 4px 10px; font-size: 12px; font-weight: 500;
      display: flex; align-items: center; gap: 5px;
      button {
        background: none; border: none; cursor: pointer;
        color: #7c3aed; font-size: 14px; padding: 0; line-height: 1;
        &:hover { color: #4c1d95; }
      }
    }

    /* ── Pricing row ── */
    .sf-row-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .sf-prefix-wrap { position: relative; }
    .sf-prefix {
      position: absolute; left: 12px; top: 50%;
      transform: translateY(-50%); color: #6b7280; font-size: 14px;
    }
    .sf-prefixed { padding-left: 26px; }

    /* ── Media preview ── */
    .sf-preview {
      display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;
      img {
        width: 80px; height: 60px; border-radius: 8px;
        object-fit: cover; border: 1.5px solid #e5e7eb;
      }
    }
    .sf-btn-ghost {
      background: #f9fafb; color: #374151; border: 1.5px solid #e5e7eb;
      border-radius: 8px; padding: 7px 14px; font-size: 13px;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      margin-bottom: 20px; transition: all .15s;
      &:hover { background: #f3f4f6; border-color: #9ca3af; }
      i { font-size: 14px; }
    }

    /* ── Summary ── */
    .sf-summary {
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 4px 0 24px;
      h4 { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: #111827; }
    }
    .sf-summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #6b7280;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
      &:last-child { border: none; }
      span:last-child { font-weight: 500; color: #111827; }
    }
    .sf-summary-price { color: #6366f1 !important; font-weight: 700 !important; }

    /* ── Actions ── */
    .sf-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
    }
    .sf-btn-primary {
      background: #6366f1; color: white; border: none;
      border-radius: 9px; padding: 11px 22px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 7px;
      transition: background .15s;
      &:hover:not(:disabled) { background: #4f46e5; }
      &:disabled { opacity: .45; cursor: not-allowed; }
      i { font-size: 15px; }
    }
    .sf-btn-secondary {
      background: white; color: #6b7280;
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      padding: 10px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      transition: all .15s;
      &:hover { border-color: #9ca3af; color: #374151; }
      i { font-size: 15px; }
    }
    .sf-btn-submit {
      background: #10b981; color: white; border: none;
      border-radius: 9px; padding: 11px 24px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 7px;
      transition: background .15s;
      &:hover:not(:disabled) { background: #059669; }
      &:disabled { opacity: .45; cursor: not-allowed; }
      i { font-size: 15px; }
      mat-spinner { display: inline-block; }
    }

    @media (max-width: 700px) {
      .sf-header { flex-direction: column; align-items: flex-start; }
      .sf-steps { align-self: stretch; }
      .sf-row-3 { grid-template-columns: 1fr 1fr; }
      .sf-panel { padding: 20px 18px; }
      .sf-step-label { display: none; }
    }
    @media (max-width: 480px) {
      .sf-row-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class ServiceFormComponent implements OnInit {
  serviceId: number | null = null;
  shopId: number | null = null;
  isEditMode = false;
  loading = false;
  currentStep = 1;

  steps = ['Overview', 'Pricing', 'Media'];
  stepSubtitles = [
    'Tell clients what you\'re offering',
    'Set your price and timeline',
    'Add images to showcase your work'
  ];

  categories = [
    'Design', 'Development', 'Marketing', 'Writing',
    'Video & Animation', 'Music & Audio', 'Programming & Tech',
    'Business', 'Lifestyle', 'Data'
  ];

  serviceData: CreateServiceRequest = {
    title: '',
    description: '',
    price: 0,
    deliveryTimeDays: 3,
    revisionCount: 2,
    category: '',
    tags: '',
    mediaUrls: '',
    requirementsDescription: ''
  };

  tagInput = '';
  tags: string[] = [];
  previewImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicesService: ServicesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.serviceId = Number(id);
      this.isEditMode = true;
      this.loadService();
    } else {
      this.loadShop();
    }
  }

  loadShop(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.servicesService.getShopByFreelancer(user.id).subscribe({
      next: (shop) => { this.shopId = shop.id; },
      error: () => {
        this.snackBar.open('Please create a shop first', 'Go to My Shop', { duration: 5000 })
          .onAction().subscribe(() => this.router.navigate(['/front/my-shop']));
      }
    });
  }

  loadService(): void {
    this.servicesService.getServiceById(this.serviceId!).subscribe({
      next: (s) => {
        this.shopId = s.shop?.id ?? s.shopId ?? null;
        this.serviceData = {
          title: s.title,
          description: s.description,
          price: s.price,
          deliveryTimeDays: s.deliveryTimeDays ?? 3,
          revisionCount: s.revisionCount ?? 0,
          category: s.category,
          tags: s.tags || '',
          mediaUrls: s.mediaUrls || '',
          requirementsDescription: s.requirementsDescription || ''
        };
        this.tags = s.tags
          ? s.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];
      },
      error: () => {
        this.snackBar.open('Service not found', 'Close', { duration: 3000 });
        this.router.navigate(['/front/my-shop']);
      }
    });
  }

  step1Valid(): boolean {
    return !!(
      this.serviceData.title && this.serviceData.title.length >= 10 &&
      this.serviceData.category &&
      this.serviceData.description && this.serviceData.description.length >= 50
    );
  }

  step2Valid(): boolean {
    return !!(
      this.serviceData.price > 0 &&
      this.serviceData.deliveryTimeDays > 0 &&
      (this.serviceData.revisionCount ?? 0) >= 0
    );
  }

  goToStep(n: number): void {
    if (n < this.currentStep ||
        (n === 2 && this.step1Valid()) ||
        (n === 3 && this.step1Valid() && this.step2Valid())) {
      this.currentStep = n;
    }
  }

  nextStep(): void { if (this.currentStep < 3) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }

  addTag(): void {
    const t = this.tagInput.trim();
    if (t && !this.tags.includes(t) && this.tags.length < 10) {
      this.tags.push(t);
      this.tagInput = '';
      this.serviceData.tags = this.tags.join(', ');
    }
  }

  removeTag(i: number): void {
    this.tags.splice(i, 1);
    this.serviceData.tags = this.tags.join(', ');
  }

  parseImages(): string[] {
    return (this.serviceData.mediaUrls || '')
      .split(',').map((u: string) => u.trim()).filter(Boolean);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  saveService(): void {
    if (!this.shopId) {
      this.snackBar.open('Shop not found', 'Close', { duration: 3000 });
      return;
    }
    this.loading = true;
    const call = this.isEditMode && this.serviceId
      ? this.servicesService.updateService(this.serviceId, this.serviceData)
      : this.servicesService.createService(this.shopId, this.serviceData);

    call.subscribe({
      next: () => {
        const msg = this.isEditMode
          ? 'Service updated!'
          : 'Service created! Submit it for review from My Shop.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.router.navigate(['/front/my-shop']);
      },
      error: (e) => {
        this.snackBar.open(e?.error?.message || 'Failed to save', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}