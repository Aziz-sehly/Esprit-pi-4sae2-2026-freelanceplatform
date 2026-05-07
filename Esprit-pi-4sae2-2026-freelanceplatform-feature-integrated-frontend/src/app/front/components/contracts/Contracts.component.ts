import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ContractService,
  Contract,
  ContractExtension,
  ContractStatus,
  ExtensionCreateRequest,
  ExtensionReviewRequest,
  ExtensionType,
  ExtensionStatus,
  RequestingParty
} from '../../services/Contract.service';
import { AuthService, UserResponse } from '../../services/auth.service';
import { MilestoneService } from '../../upwork/services/milestone.service';
import { MilestoneResponse } from '../../upwork/models/milestone.model';
import { DisputePlatformService } from '../../upwork/services/dispute-platform.service';
import { Dispute } from '../../upwork/models/communication';
import { PaymentService } from '../../upwork/services/payment.service';
import { PaymentResponse } from '../../upwork/models/payment.model';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {

  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  loading = true;

  // Filter
  filterStatus: ContractStatus | '' = '';
  searchQuery = '';

  // Selected contract
  selectedContract: Contract | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  pdfObjectUrl: string | null = null;
  pdfLoading = false;

  // Extensions
  extensions: ContractExtension[] = [];
  extensionsLoading = false;
  showExtensionModal = false;
  showReviewModal = false;
  selectedExtension: ContractExtension | null = null;

  // Extension request form
  extForm: ExtensionCreateRequest = {
    additionalDays: 7,
    extensionType: undefined,
    requestingParty: 'CLIENT',
    requesterNote: '',
    proposedAmount: undefined
  };
  extSaving = false;

  // Review form
  reviewForm: ExtensionReviewRequest = {
    status: 'APPROVED',
    responderNote: '',
    suggestedAmount: undefined,
    riskAlerts: ''
  };
  reviewSaving = false;

  // Verify
  verifyCode = '';
  verifyResult: { valid: boolean; message: string } | null = null;
  verifyLoading = false;

  // Milestones & Disputes & Payments (per selected contract)
  milestones: MilestoneResponse[] = [];
  milestonesLoading = false;
  milestonesError = '';
  disputes: Dispute[] = [];
  disputesLoading = false;
  disputesError = '';
  payments: PaymentResponse[] = [];
  paymentsLoading = false;
  paymentsError = '';

  // Tabs
  activeTab: 'details' | 'pdf' | 'extensions' | 'verify' | 'milestones' | 'disputes' | 'payments' = 'details';

  statusOptions: ContractStatus[] = [
    'PENDING', 'ACTIVE', 'EXTENDED', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  ];

  allExtensionTypeOptions: { value: ExtensionType; label: string; allowedParties: RequestingParty[]; description: string }[] = [
    {
      value: 'CLIENT_DELAY',
      label: 'Client Delay',
      allowedParties: ['CLIENT'],
      description: 'The client caused a delay (e.g. late feedback, missing assets).'
    },
    {
      value: 'SCOPE_CHANGE',
      label: 'Scope Change',
      allowedParties: ['CLIENT'],
      description: 'Additional work or requirements were added to the project.'
    },
    {
      value: 'FREELANCER_DELAY',
      label: 'Freelancer Delay',
      allowedParties: ['FREELANCER'],
      description: 'The freelancer needs more time to complete the work.'
    },
    {
      value: 'COMPLEXITY_UNDERESTIMATED',
      label: 'Complexity Underestimated',
      allowedParties: ['FREELANCER'],
      description: 'The task turned out to be more complex than originally estimated.'
    },
    {
      value: 'FORCE_MAJEURE',
      label: 'Force Majeure',
      allowedParties: ['CLIENT', 'FREELANCER'],
      description: 'An unforeseeable event outside either party\'s control.'
    },
    {
      value: 'MUTUAL_AGREEMENT',
      label: 'Mutual Agreement',
      allowedParties: ['CLIENT', 'FREELANCER'],
      description: 'Both parties agree to extend the contract.'
    }
  ];

  // User profile
  currentUser: UserResponse | null = null;
  currentRole: RequestingParty = 'CLIENT';

  constructor(
    private contractService: ContractService,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
    private milestoneService: MilestoneService,
    private disputeService: DisputePlatformService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    const role = this.auth.getUserRole();
    this.currentRole = (role === 'FREELANCER' ? 'FREELANCER' : 'CLIENT') as RequestingParty;
    this.extForm.requestingParty = this.currentRole;
    this.load();
  }

  // ── EXTENSION TYPE HELPERS ────────────────────────────────────────────────

  get availableExtensionTypes() {
    return this.allExtensionTypeOptions.filter(opt =>
      opt.allowedParties.includes(this.currentRole)
    );
  }

  get selectedTypeOption() {
    if (!this.extForm.extensionType) return null;
    return this.allExtensionTypeOptions.find(o => o.value === this.extForm.extensionType) ?? null;
  }

  get showProposedAmount(): boolean {
    return ['SCOPE_CHANGE', 'MUTUAL_AGREEMENT'].includes(this.extForm.extensionType ?? '');
  }

  get showScopeDetails(): boolean {
    return this.extForm.extensionType === 'SCOPE_CHANGE';
  }

  get showImpactNote(): boolean {
    return ['FORCE_MAJEURE', 'COMPLEXITY_UNDERESTIMATED'].includes(this.extForm.extensionType ?? '');
  }

  onExtensionTypeChange(): void {
    if (!this.showProposedAmount) {
      this.extForm.proposedAmount = undefined;
    }
  }

  // ── LOAD ──────────────────────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const obs = user.role === 'CLIENT'
      ? this.contractService.getContractsByClient(user.id)
      : user.role === 'FREELANCER'
        ? this.contractService.getContractsByFreelancer(user.id)
        : this.contractService.getAllContracts();

    obs.subscribe({
      next: (data) => {
        this.contracts = data;
        this.contracts.forEach(c => this.contractService.enrichForDisplay(c));
        this.applyFilter();
        if (this.contracts.length > 0 && !this.selectedContract) {
          this.selectContract(this.contracts[0]);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = [...this.contracts];
    if (this.filterStatus) {
      list = list.filter(c => c.status === this.filterStatus);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        String(c.id).includes(q) ||
        String(c.projectId).includes(q) ||
        c.status.toLowerCase().includes(q)
      );
    }
    this.filteredContracts = list;
  }

  // ── SELECTION ─────────────────────────────────────────────────────────────

  selectContract(c: Contract): void {
    this.selectedContract = c;
    this.activeTab = 'details';
    this.revokePdfUrl();
    this.extensions = [];
    this.verifyResult = null;
    this.milestones = [];
    this.disputes = [];
    this.payments = [];
    this.loadContractMilestones();
    this.loadContractDisputes();
    this.loadContractPayments();
  }

  loadContractMilestones(): void {
    if (!this.selectedContract) return;
    this.milestonesLoading = true;
    this.milestonesError = '';
    this.milestoneService.listByContractId(this.selectedContract.id).subscribe({
      next: (ms) => { this.milestones = ms ?? []; this.milestonesLoading = false; },
      error: (err) => {
        this.milestones = [];
        this.milestonesLoading = false;
        this.milestonesError = err?.status === 404
          ? 'Milestone service unavailable (404). Make sure milestone-service is running and registered in Eureka.'
          : err?.status === 400
            ? 'Bad request to milestone service. Check your authentication token.'
            : `Failed to load milestones (HTTP ${err?.status ?? '?'}).`;
      }
    });
  }

  loadContractDisputes(): void {
    if (!this.selectedContract) return;
    this.disputesLoading = true;
    this.disputesError = '';
    this.disputeService.list(this.selectedContract.id).subscribe({
      next: (ds) => { this.disputes = ds ?? []; this.disputesLoading = false; },
      error: (err) => {
        this.disputes = [];
        this.disputesLoading = false;
        this.disputesError = `Failed to load disputes (HTTP ${err?.status ?? '?'}).`;
      }
    });
  }

  loadContractPayments(): void {
    if (!this.selectedContract) return;
    this.paymentsLoading = true;
    this.paymentsError = '';
    this.paymentService.listByContractId(this.selectedContract.id).subscribe({
      next: (ps) => { this.payments = ps ?? []; this.paymentsLoading = false; },
      error: (err) => {
        this.payments = [];
        this.paymentsLoading = false;
        this.paymentsError = err?.status === 404
          ? 'Payment service unavailable. Make sure payment-service is running.'
          : `Failed to load payments (HTTP ${err?.status ?? '?'}).`;
      }
    });
  }

  // ── NAVIGATION ────────────────────────────────────────────────────────────

  /**
   * Freelancers  → /front/my-contracts/:id/workspace
   * Clients      → /front/my-contracts/:id/workspace-client
   * Different paths avoid the duplicate-route / inject() context bug.
   */
  openWorkspace(): void {
    if (!this.selectedContract) return;
    const role = this.auth.getUserRole();
    const path = role === 'FREELANCER' ? 'workspace' : 'workspace-client';
    this.router.navigate(['/front', 'my-contracts', this.selectedContract.id, path]);
  }

  goToDisputes(): void {
    if (!this.selectedContract || !this.currentUser) {
      this.router.navigate(['/front', 'disputes']);
      return;
    }
    const otherUserId =
      this.currentUser.id === this.selectedContract.clientId
        ? this.selectedContract.freelancerId
        : this.selectedContract.clientId;

    this.router.navigate(['/front', 'disputes'], {
      queryParams: {
        contractId: this.selectedContract.id,
        contactUserId: otherUserId,
        openCreate: '1',
      },
    });
  }

  // ── STATS ─────────────────────────────────────────────────────────────────

  milestoneStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':            return 'Ready';
      case 'SUBMITTED':          return 'Submitted';
      case 'REVISION_REQUESTED': return 'Revision';
      case 'APPROVED':           return 'Approved';
      case 'FUNDED':             return 'Funded';
      case 'PAID':               return 'Paid';
      case 'OVERDUE':            return 'Overdue';
      default:                   return status;
    }
  }

  get totalMilestoneValue(): number {
    return this.milestones.reduce((sum, m) => sum + m.amount, 0);
  }

  get paidMilestones(): number {
    return this.milestones.filter(m => m.status === 'PAID').length;
  }

  get totalPaymentsValue(): number {
    return this.payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  }

  get completedPayments(): number {
    return this.payments.filter(p => p.status === 'RELEASED').length;
  }

  paymentStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':   return 'Pending';
      case 'FUNDED':    return 'Funded';
      case 'RELEASED':  return 'Released';
      case 'COMPLETED': return 'Completed';
      case 'REFUNDED':  return 'Refunded';
      case 'FAILED':    return 'Failed';
      default:          return status;
    }
  }

  // ── PDF TAB ───────────────────────────────────────────────────────────────

  private revokePdfUrl(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfUrl = null;
  }

  openPdfTab(): void {
    this.activeTab = 'pdf';
    if (!this.selectedContract) return;
    if (this.pdfUrl) return;

    this.pdfLoading = true;
    this.contractService.downloadPdf(this.selectedContract.id).subscribe({
      next: (blob) => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        this.pdfObjectUrl = URL.createObjectURL(pdfBlob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; }
    });
  }

  downloadPdf(): void {
    if (!this.selectedContract) return;
    this.contractService.downloadPdf(this.selectedContract.id).subscribe(blob => {
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${this.selectedContract!.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── EXTENSIONS ────────────────────────────────────────────────────────────

  loadExtensions(): void {
    if (!this.selectedContract) return;
    this.activeTab = 'extensions';
    this.extensionsLoading = true;
    this.contractService.getExtensions(this.selectedContract.id).subscribe({
      next: (exts) => { this.extensions = exts; this.extensionsLoading = false; },
      error: () => { this.extensionsLoading = false; }
    });
  }

  openRequestExtensionModal(): void {
    this.extForm = {
      additionalDays: 7,
      extensionType: undefined,
      requestingParty: this.currentRole,
      requesterNote: '',
      proposedAmount: undefined
    };
    this.showExtensionModal = true;
  }

  submitExtension(): void {
    if (!this.selectedContract) return;
    this.extSaving = true;
    this.contractService.requestExtension(this.selectedContract.id, this.extForm).subscribe({
      next: () => {
        this.extSaving = false;
        this.showExtensionModal = false;
        this.loadExtensions();
      },
      error: () => { this.extSaving = false; }
    });
  }

  openReviewModal(ext: ContractExtension): void {
    this.selectedExtension = ext;
    this.reviewForm = { status: 'APPROVED', responderNote: '', suggestedAmount: undefined, riskAlerts: '' };
    this.showReviewModal = true;
  }

  submitReview(): void {
    if (!this.selectedContract || !this.selectedExtension) return;
    this.reviewSaving = true;
    this.contractService.reviewExtension(
      this.selectedContract.id,
      this.selectedExtension.id,
      this.reviewForm
    ).subscribe({
      next: () => {
        this.reviewSaving = false;
        this.showReviewModal = false;
        this.selectedExtension = null;
        this.loadExtensions();
        this.load();
      },
      error: () => { this.reviewSaving = false; }
    });
  }

  canReviewExtension(ext: ContractExtension): boolean {
    if (ext.status !== 'PENDING') return false;
    return ext.requestingParty !== this.currentRole;
  }

  getExtensionTypeLabel(type: ExtensionType | undefined): string {
    if (!type) return 'Unknown';
    const found = this.allExtensionTypeOptions.find(o => o.value === type);
    return found ? found.label : type;
  }

  getExtensionTypeDescription(type: ExtensionType | undefined): string {
    if (!type) return '';
    const found = this.allExtensionTypeOptions.find(o => o.value === type);
    return found ? found.description : '';
  }

  // ── VERIFY ────────────────────────────────────────────────────────────────

  verify(): void {
    if (!this.selectedContract || !this.verifyCode.trim()) return;
    this.verifyLoading = true;
    this.contractService.verifyContract(this.selectedContract.id, this.verifyCode).subscribe({
      next: (res) => {
        this.verifyResult = { valid: res.valid, message: res.message };
        this.verifyLoading = false;
      },
      error: () => { this.verifyLoading = false; }
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  statusClass(status: string): string {
    return 'badge-' + status.toLowerCase();
  }

  getSignedCount(contract: Contract): number {
    return contract.signatures.filter(s => s.status === 'SIGNED').length;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}