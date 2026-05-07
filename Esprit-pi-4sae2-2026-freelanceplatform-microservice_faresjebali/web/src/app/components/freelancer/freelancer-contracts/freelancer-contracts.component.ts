import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ContractResponse, ContractStatus } from '../../../models/contract.model';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';
import { ContractService } from '../../../services/contract.service';

@Component({
  selector: 'app-freelancer-contracts',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, ResourcesPanelComponent],
  templateUrl: './freelancer-contracts.component.html',
  styleUrls: ['./freelancer-contracts.component.scss'],
})
export class FreelancerContractsComponent {
  readonly freelancerId = 202;

  loading = false;
  contracts: ContractResponse[] = [];
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  selectedContractId: number | null = null;

  constructor(private readonly contractService: ContractService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractService.list({ freelancerId: this.freelancerId }).subscribe({
      next: (contracts) => {
        this.loading = false;
        this.contracts = contracts ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Freelancer contracts could not be loaded.', 'error');
      },
    });
  }

  accept(contract: ContractResponse): void {
    this.loading = true;
    this.contractService.accept(contract.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Contract accepted.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract could not be accepted.', 'error');
      },
    });
  }

  reject(contract: ContractResponse): void {
    this.loading = true;
    this.contractService.reject(contract.id).subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Contract rejected.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract could not be rejected.', 'error');
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

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }
}
