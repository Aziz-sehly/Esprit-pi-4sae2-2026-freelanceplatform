// checkout.component.ts - Improved version
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FreelancerService, ServiceAddOn, ServicesService } from '../../services/services.service';
import { AuthService } from '../../services/auth.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatStepperModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="checkout-container" [class.dark-theme]="themeService.isDark()">
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <h5>Checkout</h5>
        <ol class="breadcrumb">
          <li><a routerLink="/front">Home</a></li>
          <li><a routerLink="/front/services">Services</a></li>
          <li>Checkout</li>
        </ol>
      </div>

      <mat-stepper [linear]="true" #stepper class="checkout-stepper">
        
        <!-- Step 1: Review Order -->
        <mat-step label="Review Order" [completed]="requirements.length >= 10">
          <div class="step-content">
            <div class="checkout-grid">
              
              <!-- Left Column - Service Details -->
              <div class="checkout-left">
                <div class="checkout-card">
                  <h3 class="card-title">Service Details</h3>
                  
                  <div class="service-summary">
                    <img [src]="getServiceImage()" 
                         class="service-image" 
                         [alt]="service?.title"
                         (error)="onImageError($event)">
                    <div class="service-info">
                      <h4>{{ service?.title }}</h4>
                      <p class="service-desc">{{ service?.description | slice:0:120 }}...</p>
                      <div class="service-meta">
                        <span><i class="ri-time-line"></i> {{ service?.deliveryTimeDays }} days</span>
                        <span><i class="ri-refresh-line"></i> {{ service?.revisionCount ?? 0 }} revisions</span>
                      </div>
                    </div>
                    <div class="service-price">
                      <span class="price-label">Base Price</span>
                      <span class="price-value">\${{ service?.price }}</span>
                      <span class="quantity-badge">x {{ quantity }}</span>
                    </div>
                  </div>

                  <!-- Add-ons -->
                  <div class="addons-section" *ngIf="selectedAddOns.length > 0">
                    <h4>Selected Add-ons</h4>
                    <div class="addon-item" *ngFor="let addon of selectedAddOns">
                      <div class="addon-info">
                        <span class="addon-name">{{ addon.title }}</span>
                        <span class="addon-desc" *ngIf="addon.description">{{ addon.description }}</span>
                      </div>
                      <div class="addon-price">
                        <span>+\${{ addon.price }}</span>
                        <span class="addon-days">+{{ addon.deliveryTimeExtraDays }}d</span>
                      </div>
                    </div>
                  </div>

                  <!-- Requirements Form -->
                  <div class="requirements-section">
                    <h4>Project Requirements</h4>
                    <p class="hint-text">Please provide detailed requirements to help the freelancer understand your needs.</p>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Describe your requirements *</mat-label>
                      <textarea matInput
                                [(ngModel)]="requirements"
                                rows="6"
                                placeholder="e.g., I need a modern logo for my tech startup. Colors: blue and white. Style: minimalist..."
                                [class.invalid]="requirements.length < 10 && requirements.length > 0"></textarea>
                      <mat-hint align="end">{{ requirements.length }} characters</mat-hint>
                      <mat-error *ngIf="requirements.length < 10 && requirements.length > 0">
                        Minimum 10 characters required
                      </mat-error>
                    </mat-form-field>
                  </div>
                </div>
              </div>

              <!-- Right Column - Order Summary -->
              <div class="checkout-right">
                <div class="summary-card">
                  <h3 class="card-title">Order Summary</h3>
                  
                  <div class="summary-row">
                    <span>Service Fee (5%)</span>
                    <span>\${{ serviceFee | number:'1.2-2' }}</span>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="summary-row total-row">
                    <span>Total Amount</span>
                    <span class="total-value">\${{ total | number:'1.2-2' }}</span>
                  </div>
                  
                  <div class="delivery-info">
                    <i class="ri-truck-line"></i>
                    <span>Estimated Delivery: <strong>{{ totalDeliveryDays }} days</strong></span>
                  </div>

                  <button class="btn-continue" 
                          [disabled]="requirements.length < 10"
                          (click)="stepper.next()">
                    Continue to Payment
                  </button>

                  <p class="secure-note">
                    <i class="ri-shield-check-line"></i>
                    Secure SSL encrypted payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </mat-step>

        <!-- Step 2: Payment -->
        <mat-step label="Payment">
          <div class="step-content payment-step">
            <div class="payment-container">
              <div class="payment-card">
                <h3 class="card-title">Select Payment Method</h3>

                <mat-radio-group [(ngModel)]="paymentMethod" class="payment-options">
                  <mat-radio-button value="card" class="payment-option">
                    <div class="option-content">
                      <i class="ri-bank-card-line"></i>
                      <div>
                        <span class="option-title">Credit/Debit Card</span>
                        <span class="option-subtitle">Visa, Mastercard, Amex</span>
                      </div>
                    </div>
                  </mat-radio-button>

                  <mat-radio-button value="paypal" class="payment-option">
                    <div class="option-content">
                      <i class="ri-paypal-line"></i>
                      <div>
                        <span class="option-title">PayPal</span>
                        <span class="option-subtitle">Fast and secure checkout</span>
                      </div>
                    </div>
                  </mat-radio-button>
                </mat-radio-group>

                <!-- Card Form -->
                <div class="card-form" *ngIf="paymentMethod === 'card'">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Card Number</mat-label>
                    <input matInput [(ngModel)]="cardNumber" 
                           placeholder="1234 5678 9012 3456"
                           maxlength="19">
                    <i matSuffix class="ri-check-line success-icon" *ngIf="cardNumber.length >= 16"></i>
                  </mat-form-field>

                  <div class="card-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Expiry Date</mat-label>
                      <input matInput [(ngModel)]="cardExpiry" 
                             placeholder="MM/YY"
                             maxlength="5">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>CVV</mat-label>
                      <input matInput [(ngModel)]="cardCvv" 
                             placeholder="123"
                             type="password"
                             maxlength="4">
                    </mat-form-field>
                  </div>
                </div>

                <!-- Order Summary Mini -->
                <div class="payment-summary">
                  <div class="summary-row">
                    <span>Total to Pay</span>
                    <span class="total-value">\${{ total | number:'1.2-2' }}</span>
                  </div>
                </div>

                <div class="payment-actions">
                  <button class="btn-back" (click)="stepper.previous()">
                    <i class="ri-arrow-left-line"></i> Back
                  </button>
                  <button class="btn-pay" 
                          [disabled]="!isPaymentValid() || loading"
                          (click)="placeOrder()">
                    <mat-spinner diameter="16" *ngIf="loading"></mat-spinner>
                    <span *ngIf="!loading">Pay \${{ total | number:'1.2-2' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Confirmation -->
        <mat-step label="Confirmation">
          <div class="step-content confirmation-step">
            <div class="confirmation-card">
              <div class="success-icon">
                <i class="ri-check-double-line"></i>
              </div>
              <h2>Order Placed Successfully!</h2>
              <p>Your order has been sent to the freelancer. You'll be notified when they accept it.</p>

              <div class="order-details-box">
                <div class="detail-row">
                  <span>Order ID</span>
                  <strong>#ORD-{{ orderId }}</strong>
                </div>
                <div class="detail-row">
                  <span>Service</span>
                  <strong>{{ service?.title | slice:0:30 }}...</strong>
                </div>
                <div class="detail-row">
                  <span>Total Amount</span>
                  <strong>\${{ total | number:'1.2-2' }}</strong>
                </div>
                <div class="detail-row">
                  <span>Status</span>
                  <span class="status-badge pending">Pending Acceptance</span>
                </div>
              </div>

              <div class="confirmation-actions">
                <a class="btn-primary" routerLink="/front/my-orders">
                  <i class="ri-list-check"></i> View My Orders
                </a>
                <a class="btn-secondary" routerLink="/front/services">
                  <i class="ri-store-3-line"></i> Browse More Services
                </a>
              </div>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    /* Replace the checkout-container and related styles with: */
.checkout-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f7fa;
  min-height: 100vh;
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.breadcrumb-bar h5 { 
  margin: 0; 
  font-size: 18px; 
  font-weight: 700; 
  color: #1a1a2e; 
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: #9ca3af;
}
.breadcrumb a { color: #6366f1; text-decoration: none; }

/* Force light mode for stepper */
.checkout-stepper {
  background: transparent !important;
}

::ng-deep .checkout-stepper .mat-horizontal-stepper-header-container {
  background: white !important;
  border-radius: 12px 12px 0 0;
  padding: 16px 24px !important;
  border-bottom: 1px solid #e5e7eb;
}

::ng-deep .checkout-stepper .mat-step-header {
  background: transparent !important;
}

::ng-deep .checkout-stepper .mat-step-header .mat-step-label {
  color: #374151 !important;
  font-weight: 500;
}

::ng-deep .checkout-stepper .mat-step-header.mat-accent .mat-step-label {
  color: #6366f1 !important;
}

::ng-deep .checkout-stepper .mat-horizontal-content-container {
  padding: 24px 0 0 !important;
  background: transparent !important;
}

    .checkout-card, .summary-card, .payment-card, .confirmation-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
    }

    .dark-theme {
      .checkout-card, .summary-card, .payment-card, .confirmation-card {
        background: #1e1e2d;
        color: #e5e7eb;
      }
      .breadcrumb-bar h5 { color: #f3f4f6; }
    }

    .card-title {
      margin: 0 0 20px;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      .dark-theme & { color: #f3f4f6; }
    }

    .service-summary {
      display: flex;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
      .dark-theme & { border-bottom-color: #2d2d3d; }
    }

    .service-image {
      width: 100px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .service-info {
      flex: 1;
      h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
      .service-desc { 
        margin: 0 0 8px; 
        font-size: 13px; 
        color: #6b7280;
        .dark-theme & { color: #9ca3af; }
      }
    }

    .service-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #9ca3af;
      i { margin-right: 4px; }
    }

    .service-price {
      text-align: right;
      flex-shrink: 0;
      .price-label { display: block; font-size: 11px; color: #9ca3af; }
      .price-value { display: block; font-size: 20px; font-weight: 700; color: #6366f1; }
      .quantity-badge { 
        display: inline-block;
        padding: 2px 8px;
        background: #ede9fe;
        color: #7c3aed;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
    }

    .addons-section {
      margin-top: 20px;
      h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    }

    .addon-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 8px;
      .dark-theme & { background: #2d2d3d; }
    }

    .addon-name { font-size: 13px; font-weight: 500; display: block; }
    .addon-desc { font-size: 11px; color: #9ca3af; }
    .addon-price { 
      text-align: right;
      font-weight: 600;
      color: #6366f1;
      .addon-days { 
        display: block; 
        font-size: 11px; 
        font-weight: 400;
        color: #9ca3af; 
      }
    }

    .requirements-section {
      margin-top: 24px;
      h4 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
      .hint-text { font-size: 12px; color: #9ca3af; margin-bottom: 16px; }
    }

    .full-width { width: 100%; }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: #6b7280;
      .dark-theme & { color: #9ca3af; }
    }

    .total-row {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      padding: 16px 0;
      .dark-theme & { color: #f3f4f6; }
    }

    .total-value {
      color: #6366f1;
      font-size: 24px;
    }

    .delivery-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ecfdf5;
      border-radius: 8px;
      margin: 16px 0;
      color: #059669;
      .dark-theme & { background: #064e3b; color: #6ee7b7; }
    }

    .btn-continue {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .2s;
      &:hover:not(:disabled) { opacity: .9; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .secure-note {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
      i { color: #10b981; margin-right: 4px; }
    }

    /* Payment Step */
    .payment-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .payment-option {
      padding: 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      .dark-theme & { border-color: #2d2d3d; }
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 12px;
      i { font-size: 24px; color: #6366f1; }
      .option-title { display: block; font-weight: 600; font-size: 14px; }
      .option-subtitle { display: block; font-size: 12px; color: #9ca3af; }
    }

    .card-form {
      margin: 20px 0;
    }

    .card-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .payment-summary {
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
    }

    .payment-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }

    .btn-back {
      padding: 12px 24px;
      background: transparent;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-pay {
      padding: 12px 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    /* Confirmation Step */
    .confirmation-step {
      display: flex;
      justify-content: center;
    }

    .confirmation-card {
      max-width: 500px;
      text-align: center;
      .success-icon {
        width: 80px;
        height: 80px;
        background: #ecfdf5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        i { font-size: 40px; color: #10b981; }
      }
      h2 { margin: 0 0 12px; font-size: 24px; }
      p { color: #6b7280; margin-bottom: 24px; }
    }

    .order-details-box {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: left;
      .dark-theme & { background: #2d2d3d; }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .status-badge.pending {
      background: #fef9c3;
      color: #854d0e;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .confirmation-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      .btn-primary, .btn-secondary {
        padding: 12px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-primary {
        background: #6366f1;
        color: white;
      }
      .btn-secondary {
        border: 1.5px solid #e5e7eb;
        color: #6b7280;
      }
    }

    @media (max-width: 900px) {
      .checkout-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  service: FreelancerService | null = null;
  serviceId: number = 0;
  quantity: number = 1;
  selectedAddOnIds: number[] = [];
  selectedAddOns: ServiceAddOn[] = [];

  requirements = '';
  paymentMethod: 'card' | 'paypal' = 'card';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  loading = false;
  orderId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicesService: ServicesService,
    private authService: AuthService,
    public themeService: CustomizerSettingsService,
    private snackBar: MatSnackBar,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.serviceId = Number(params['serviceId']);
      this.quantity = Number(params['quantity']) || 1;
      this.selectedAddOnIds = params['addOns']?.split(',').map(Number) || [];

      if (this.serviceId) {
        this.loadService();
      } else {
        this.router.navigate(['/front/services']);
      }
    });
  }

  loadService(): void {
    this.servicesService.getServiceById(this.serviceId).subscribe({
      next: (service) => {
        this.service = service;
        this.loadAddOns();
      },
      error: () => this.router.navigate(['/front/services'])
    });
  }

  loadAddOns(): void {
    if (this.selectedAddOnIds.length === 0) return;
    this.servicesService.getAddOnsByService(this.serviceId).subscribe({
      next: (addOns) => {
        this.selectedAddOns = addOns.filter(a => this.selectedAddOnIds.includes(a.id));
      }
    });
  }

  getServiceImage(): string {
    return this.service?.images?.[0] || 'assets/images/placeholder-service.jpg';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/placeholder-service.jpg';
  }

  get subtotal(): number {
    const basePrice = (this.service?.price || 0) * this.quantity;
    const addOnsPrice = this.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    return basePrice + addOnsPrice;
  }

  get serviceFee(): number {
    return Math.round(this.subtotal * 0.05 * 100) / 100;
  }

  get total(): number {
    return this.subtotal + this.serviceFee;
  }

  get totalDeliveryDays(): number {
    const baseDays = this.service?.deliveryTimeDays ?? this.service?.deliveryDays ?? 0;
    const extraDays = this.selectedAddOns.reduce((sum, a) => sum + (a.deliveryTimeExtraDays ?? 0), 0);
    return baseDays + extraDays;
  }

  isPaymentValid(): boolean {
    if (this.paymentMethod === 'card') {
      return this.cardNumber.length >= 16 && 
             this.cardExpiry.length === 5 && 
             this.cardCvv.length >= 3;
    }
    return true;
  }

  placeOrder(): void {
    this.loading = true;
    
    this.orderService.createOrder({
      serviceId: this.serviceId,
      selectedAddOns: this.selectedAddOnIds.join(','),
      totalPrice: this.total,
      requirements: this.requirements
    }).subscribe({
      next: (order) => {
        this.orderId = order.id?.toString() || this.generateOrderId();
        this.loading = false;
        this.stepper.next();
      },
      error: (err) => {
        console.error('Order failed:', err);
        this.snackBar.open('Failed to place order. Please try again.', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  private generateOrderId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }
}