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
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Contract, ContractStatus, ContractService } from '../../../../services/Contract.service';
import { MilestoneResponse } from '../../../models/milestone.model';
import { ResourcesPanelComponent } from '../../shared/resources-panel/resources-panel.component';
import { MilestoneService } from '../../../services/milestone.service';
import { AuthService } from '../../../../services/auth.service';

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
  clientId = 0;
  readonly freelancerId = 202;

  loading = false;
  contracts: Contract[] = [];
  banner = '';
  bannerTone: 'success' | 'error' = 'success';
  selectedContractId: number | null = null;
  /** Jalons par id de contrat (chargés après la liste des contrats). */
  milestonesByContractId: Record<number, MilestoneResponse[]> = {};
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
    private readonly contractService: ContractService,
    private readonly milestoneService: MilestoneService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    const me = this.auth.getCurrentUser();
    if (!me?.id) {
      this.showBanner('Connectez-vous pour gérer vos contrats.', 'error');
      return;
    }
    this.clientId = me.id;

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
    this.contractService.getContractsByClient(this.clientId).subscribe({
      next: (contracts) => {
        this.loading = false;
        this.contracts = contracts ?? [];
        this.contracts.forEach(c => this.contractService.enrichForDisplay(c));
        this.loadMilestonesForContracts();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contracts could not be loaded.', 'error');
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

  cancel(contract: Contract): void {
    this.loading = true;
    this.contractService.updateStatus(contract.id, 'CANCELLED').subscribe({
      next: () => {
        this.loading = false;
        this.showBanner('Contract cancelled.', 'success');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner(err?.error?.message || 'Contract could not be cancelled.', 'error');
      },
    });
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

  get activeCount(): number {
    return this.contracts.filter((contract) => contract.status === 'ACTIVE').length;
  }

  get pendingCount(): number {
    return this.contracts.filter((contract) => contract.status === 'PENDING').length;
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
