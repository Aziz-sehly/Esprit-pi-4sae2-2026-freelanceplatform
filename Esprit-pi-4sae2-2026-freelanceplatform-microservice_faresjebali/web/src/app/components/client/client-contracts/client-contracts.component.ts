import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContractResponse, ContractStatus } from '../../../models/contract.model';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';
import { ContractService } from '../../../services/contract.service';

@Component({
  selector: 'app-client-contracts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ResourcesPanelComponent,
  ],
  templateUrl: './client-contracts.component.html',
  styleUrls: ['./client-contracts.component.scss'],
})
export class ClientContractsComponent {
  readonly clientId = 101;
  readonly freelancerId = 202;

  loading = false;
  contracts: ContractResponse[] = [];
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  selectedContractId: number | null = null;
  readonly minDate = this.startOfToday();

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    scope: ['', [Validators.required, Validators.maxLength(2000)]],
    totalBudget: [null as number | null, [Validators.required, Validators.min(1)]],
    clientName: ['Talently Client', [Validators.required]],
    freelancerName: ['Mehdi Freelancer', [Validators.required]],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly contractService: ContractService
  ) {}

  ngOnInit(): void {
    this.form.controls.startDate.valueChanges.subscribe((startDate) => {
      const endDate = this.form.controls.endDate.value;
      if (startDate && endDate && endDate < startDate) {
        this.form.controls.endDate.setValue(null);
      }
    });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractService.list({ clientId: this.clientId }).subscribe({
      next: (contracts) => {
        this.loading = false;
        this.contracts = contracts ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contracts could not be loaded.', 'error');
      },
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showBanner('Complete the contract form before sending it.', 'error');
      return;
    }

    this.loading = true;
    const value = this.form.getRawValue();
    this.contractService.create({
      clientId: this.clientId,
      freelancerId: this.freelancerId,
      title: value.title!,
      scope: value.scope!,
      totalBudget: value.totalBudget!,
      clientName: value.clientName!,
      freelancerName: value.freelancerName!,
      startDate: this.toIsoDateString(value.startDate),
      endDate: this.toIsoDateString(value.endDate),
    }).subscribe({
      next: () => {
        this.loading = false;
        this.form.reset({
          title: '',
          scope: '',
          totalBudget: null,
          clientName: 'Talently Client',
          freelancerName: 'Mehdi Freelancer',
          startDate: null,
          endDate: null,
        });
        this.showBanner('Contract sent for freelancer acceptance.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract creation failed.', 'error');
      },
    });
  }

  delete(contract: ContractResponse): void {
    this.loading = true;
    this.contractService.delete(contract.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Contract removed.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract could not be deleted.', 'error');
      },
    });
  }

  inspectResources(contract: ContractResponse): void {
    this.selectedContractId = this.selectedContractId === contract.id ? null : contract.id;
  }

  chipColor(status: ContractStatus): 'primary' | 'accent' | 'warn' | undefined {
    if (status === 'ACTIVE') {
      return 'primary';
    }
    if (status === 'PENDING_ACCEPTANCE') {
      return 'accent';
    }
    if (status === 'REJECTED' || status === 'CANCELLED') {
      return 'warn';
    }
    return undefined;
  }

  statusLabel(status: ContractStatus): string {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return 'Waiting for acceptance';
      case 'ACTIVE':
        return 'Active';
      case 'REJECTED':
        return 'Rejected';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'DRAFT':
        return 'Draft';
      default:
        return status;
    }
  }

  get activeCount(): number {
    return this.contracts.filter((contract) => contract.status === 'ACTIVE').length;
  }

  get pendingCount(): number {
    return this.contracts.filter((contract) => contract.status === 'PENDING_ACCEPTANCE').length;
  }

  get endDateMin(): Date {
    return this.form.controls.startDate.value ?? this.minDate;
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }

  private toIsoDateString(value: Date | null): string | null {
    if (!value) {
      return null;
    }

    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString().slice(0, 10);
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
}
