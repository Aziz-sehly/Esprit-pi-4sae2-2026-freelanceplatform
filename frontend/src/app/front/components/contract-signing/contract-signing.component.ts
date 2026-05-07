import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractSigningService, SignRequest } from '../../services/contract-signing.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signing-container">
      <!-- Header -->
      <div class="contract-header">
        <h1>Contract #{{ contractId }}</h1>
        <div class="role-badge" [class]="'role-' + role?.toLowerCase()">
          Signing as: {{ role }}
        </div>
      </div>

      <!-- Error Messages -->
      <div *ngIf="errorMessage" class="alert alert-error">
        <span class="icon">⚠️</span>
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="alert alert-success">
        <span class="icon">✅</span>
        {{ successMessage }}
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading contract details...</p>
      </div>

      <!-- Main Signing Interface -->
      <div *ngIf="!isLoading && !errorMessage && !isSigned" class="signing-interface">

        <!-- Contract Info Card -->
        <div class="info-card">
          <h3>Contract Information</h3>
          <div class="info-row">
            <span class="label">Contract ID:</span>
            <span class="value">#{{ contractId }}</span>
          </div>
          <div class="info-row">
            <span class="label">Your Role:</span>
            <span class="value" [class]="role?.toLowerCase()">{{ role }}</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="value status-pending">Awaiting Signature</span>
          </div>
        </div>

        <!-- Signature Pad -->
        <div class="signature-section">
          <div class="tab-buttons">
            <button
              [class.active]="activeTab === 'draw'"
              (click)="setTab('draw')"
              class="tab-btn">
              ✍️ Draw Signature
            </button>
            <button
              [class.active]="activeTab === 'upload'"
              (click)="setTab('upload')"
              class="tab-btn">
              📷 Upload Image
            </button>
          </div>

          <!-- Draw Tab -->
          <div *ngIf="activeTab === 'draw'" class="tab-content">
            <div class="canvas-container">
              <canvas
                #signatureCanvas
                class="signature-canvas"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()">
              </canvas>
              <div *ngIf="!hasSignature" class="canvas-placeholder">
                Draw your signature here
              </div>
            </div>
            <div class="canvas-actions">
              <button (click)="clearCanvas()" class="btn btn-secondary">
                Clear
              </button>
            </div>
          </div>

          <!-- Upload Tab -->
          <div *ngIf="activeTab === 'upload'" class="tab-content">
            <div class="upload-area"
                 (dragover)="onDragOver($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              <input
                #fileInput
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                hidden>
              <div class="upload-content">
                <span class="upload-icon">📤</span>
                <p>Click or drag image here</p>
                <p class="upload-hint">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <div *ngIf="uploadedImage" class="uploaded-preview">
              <img [src]="uploadedImage" alt="Signature preview">
              <button (click)="removeUploadedImage()" class="btn btn-danger btn-sm">
                Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Sign Button -->
        <button
          (click)="submitSignature()"
          [disabled]="!canSubmit || isSubmitting"
          class="btn btn-primary btn-sign">
          <span *ngIf="isSubmitting" class="spinner-small"></span>
          <span *ngIf="!isSubmitting">✍️ Sign Contract</span>
          <span *ngIf="isSubmitting">Signing...</span>
        </button>

        <p class="terms-text">
          By signing, you agree to the terms and conditions of this contract.
          This signature is legally binding.
        </p>
      </div>

      <!-- Already Signed State -->
      <div *ngIf="isSigned" class="signed-state">
        <div class="success-icon">🎉</div>
        <h2>Contract Signed Successfully!</h2>
        <p>You have successfully signed contract #{{ contractId }}.</p>
        <button (click)="goToDashboard()" class="btn btn-primary">
          Go to Dashboard
        </button>
      </div>

      <!-- Footer -->
      <div class="signing-footer">
        <p>Logged in as: {{ currentUser?.email }}</p>
        <button (click)="logout()" class="btn-link">Sign out</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .signing-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .contract-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .contract-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }

    .role-badge {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-client { background: #dbeafe; color: #1e40af; }
    .role-freelancer { background: #dcfce7; color: #166534; }

    .alert {
      margin: 20px;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .icon { font-size: 20px; }

    .loading-state { text-align: center; padding: 60px 20px; }

    .spinner {
      width: 50px; height: 50px;
      border: 4px solid #e5e7eb;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .info-card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px; }
    .info-card h3 { margin: 0 0 16px 0; color: #1e293b; font-size: 18px; }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #1e293b; font-weight: 600; }
    .value.client { color: #1e40af; }
    .value.freelancer { color: #166534; }

    .status-pending {
      color: #d97706; background: #fef3c7;
      padding: 4px 12px; border-radius: 12px; font-size: 12px;
    }

    .signature-section { margin: 20px; }

    .tab-buttons { display: flex; gap: 8px; margin-bottom: 20px; }

    .tab-btn {
      flex: 1; padding: 14px;
      border: 2px solid #e2e8f0;
      background: white; border-radius: 10px;
      cursor: pointer; font-weight: 600; transition: all 0.2s;
    }

    .tab-btn:hover { border-color: #4f46e5; color: #4f46e5; }
    .tab-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }

    .canvas-container {
      position: relative;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      height: 250px;
      background: #f8fafc;
    }

    .signature-canvas { width: 100%; height: 100%; cursor: crosshair; border-radius: 12px; }

    .canvas-placeholder {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #94a3b8; pointer-events: none; font-size: 16px;
    }

    .canvas-actions { display: flex; justify-content: flex-end; margin-top: 12px; gap: 10px; }

    .upload-area {
      border: 2px dashed #cbd5e1; border-radius: 12px;
      padding: 40px; text-align: center;
      cursor: pointer; transition: all 0.2s;
    }

    .upload-area:hover { border-color: #4f46e5; background: #f5f3ff; }
    .upload-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .upload-content p { margin: 0; color: #475569; font-weight: 500; }
    .upload-hint { font-size: 12px; color: #94a3b8; margin-top: 8px !important; }

    .uploaded-preview { margin-top: 20px; text-align: center; }
    .uploaded-preview img { max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #e2e8f0; }

    .btn {
      padding: 12px 24px; border-radius: 8px; border: none;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
      display: inline-flex; align-items: center; gap: 8px;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white; width: 100%; justify-content: center; padding: 16px; font-size: 16px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
    }

    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-danger { background: #fee2e2; color: #dc2626; }
    .btn-sm { padding: 8px 16px; font-size: 14px; }
    .btn-sign { margin: 20px; width: calc(100% - 40px); }

    .spinner-small {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .terms-text { text-align: center; color: #64748b; font-size: 12px; margin: 0 20px 30px; }

    .signed-state { text-align: center; padding: 60px 20px; }
    .success-icon { font-size: 80px; margin-bottom: 20px; }
    .signed-state h2 { color: #166534; margin-bottom: 12px; }
    .signed-state p { color: #64748b; margin-bottom: 30px; }

    .signing-footer {
      background: #f8fafc; padding: 20px;
      display: flex; justify-content: space-between;
      align-items: center; border-top: 1px solid #e2e8f0;
    }

    .signing-footer p { margin: 0; color: #64748b; font-size: 14px; }

    .btn-link {
      background: none; border: none;
      color: #4f46e5; cursor: pointer; font-weight: 500;
    }

    .btn-link:hover { text-decoration: underline; }
  `]
})
export class ContractSigningComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  contractId!: number;
  token!: string;
  role!: string;

  isLoading = true;
  isSubmitting = false;
  isSigned = false;
  hasSignature = false;
  activeTab: 'draw' | 'upload' = 'draw';

  errorMessage: string | null = null;
  successMessage: string | null = null;

  currentUser: any;
  uploadedImage: string | null = null;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signingService: ContractSigningService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.route.paramMap.subscribe(params => {
      this.contractId = +params.get('contractId')!;
    });

    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token') || '';
      this.role = params.get('role') || '';

      if (!this.token) {
        this.errorMessage = 'Invalid signing link. Token is missing.';
        this.isLoading = false;
        return;
      }

      this.validateAccess();
    });
  }

  ngAfterViewInit(): void {
    if (this.canvasRef) {
      this.initCanvas();
    }
  }

  private initCanvas(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private validateAccess(): void {
    this.signingService.canSign(this.contractId, this.token).subscribe({
      next: (result) => {
        if (result.canSign) {
          this.isLoading = false;
        } else {
          this.errorMessage = result.message || 'You are not authorized to sign this contract.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to validate signing access.';
        this.isLoading = false;
      }
    });
  }

  setTab(tab: 'draw' | 'upload'): void {
    this.activeTab = tab;
    if (tab === 'draw') {
      setTimeout(() => this.initCanvas(), 0);
    }
  }

  startDrawing(e: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e: MouseEvent): void {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  startDrawingTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.canvas.dispatchEvent(mouseEvent);
  }

  drawTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.canvas.dispatchEvent(mouseEvent);
  }

  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasSignature = false;
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please upload an image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'File size must be less than 5MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImage = e.target?.result as string;
      this.hasSignature = true;
    };
    reader.readAsDataURL(file);
  }

  removeUploadedImage(): void {
    this.uploadedImage = null;
    this.hasSignature = false;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  get canSubmit(): boolean {
    return this.hasSignature && !this.isSubmitting;
  }

  getSignatureData(): string {
    if (this.activeTab === 'draw') {
      return this.canvas.toDataURL('image/png');
    }
    return this.uploadedImage || '';
  }

  submitSignature(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.errorMessage = null;

    const request: SignRequest = {
      token: this.token,
      signatureData: this.getSignatureData(),
      ipAddress: '0.0.0.0'
    };

    this.signingService.submitSignature(this.contractId, request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSigned = true;
        this.successMessage = 'Contract signed successfully!';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Failed to submit signature. Please try again.';
      }
    });
  }

  goToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'CLIENT') {
      this.router.navigate(['/front/my-jobs']);
    } else {
      this.router.navigate(['/front/my-proposals']);
    }
  }

  logout(): void {
    const redirectUrl = `/front/sign-contract/${this.contractId}?token=${this.token}&role=${this.role}`;
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/front/login'], {
          queryParams: { redirect: redirectUrl }
        });
      }
    });
  }
}