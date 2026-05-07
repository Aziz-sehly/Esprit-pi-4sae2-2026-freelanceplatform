import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContractResponse } from '../../../models/contract.model';
import { ContractService } from '../../../services/contract.service';
import { DisputeCenterComponent } from '../../shared/dispute-center/dispute-center.component';

@Component({
  selector: 'app-freelancer-disputes',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    DisputeCenterComponent,
  ],
  templateUrl: './freelancer-disputes.component.html',
})
export class FreelancerDisputesComponent {
  loading = false;
  contract: ContractResponse | null = null;
  error = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly contractService: ContractService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.error = 'The selected contract is invalid.';
        return;
      }

      this.loading = true;
      this.contractService.getById(id).subscribe({
        next: (contract) => {
          this.loading = false;
          this.contract = contract;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Contract could not be loaded.';
        },
      });
    });
  }
}
