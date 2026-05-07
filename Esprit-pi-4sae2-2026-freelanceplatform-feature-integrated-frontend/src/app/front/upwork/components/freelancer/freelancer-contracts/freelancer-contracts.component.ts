import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Contract, ContractStatus, ContractService } from '../../../../services/Contract.service';
import { MilestoneResponse } from '../../../models/milestone.model';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';
import { MilestoneService } from '../../../services/milestone.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-freelancer-contracts',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, ResourcesPanelComponent],
  templateUrl: './freelancer-contracts.component.html',
  styleUrls: ['./freelancer-contracts.component.scss'],
})
export class FreelancerContractsComponent {
  freelancerId = 0;

  loading = false;
  contracts: Contract[] = [];
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  selectedContractId: number | null = null;
  milestonesByContractId: Record<number, MilestoneResponse[]> = {};

  constructor(
    private readonly contractService: ContractService,
    private readonly milestoneService: MilestoneService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    const me = this.auth.getCurrentUser();
    if (!me?.id) {
      this.showBanner('Connectez-vous pour voir vos contrats.', 'error');
      return;
    }
    this.freelancerId = me.id;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractService.getContractsByFreelancer(this.freelancerId).subscribe({
      next: (contracts) => {
        this.loading = false;
        this.contracts = contracts ?? [];
        this.contracts.forEach(c => this.contractService.enrichForDisplay(c));
        this.loadMilestonesForContracts();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Freelancer contracts could not be loaded.', 'error');
      },
    });
  }

  private loadMilestonesForContracts(): void {
    if (!this.contracts.length) {
      this.milestonesByContractId = {};
      return;
    }
    forkJoin(
      this.contracts.map((c) =>
        this.milestoneService.listByContractId(c.id).pipe(
          catchError(() => of([] as MilestoneResponse[])),
          map((ms) => [c.id, ms ?? []] as const),
        ),
      ),
    ).subscribe((entries) => {
      this.milestonesByContractId = Object.fromEntries(entries);
    });
  }

  milestonesFor(contractId: number): MilestoneResponse[] {
    return this.milestonesByContractId[contractId] ?? [];
  }

  inspectResources(contract: Contract): void {
    this.selectedContractId = this.selectedContractId === contract.id ? null : contract.id;
  }

  chipColor(status: ContractStatus): 'primary' | 'accent' | 'warn' | undefined {
    if (status === 'ACTIVE' || status === 'EXTENDED') return 'primary';
    if (status === 'PENDING') return 'accent';
    if (status === 'CANCELLED' || status === 'DISPUTED') return 'warn';
    return undefined;
  }

  statusLabel(status: ContractStatus): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'ACTIVE': return 'Active';
      case 'EXTENDED': return 'Extended';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'DISPUTED': return 'Disputed';
      default: return status;
    }
  }

  private showBanner(message: string, tone: 'success' | 'error'): void {
    this.banner = message;
    this.bannerTone = tone;
  }
}
