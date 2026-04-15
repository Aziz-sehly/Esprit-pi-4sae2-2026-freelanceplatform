import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../services/job.service';
import { ProposalService } from '../../services/proposal.service';
import { AuthService } from '../../services/auth.service';
import { Job } from '../../models/models';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="job-detail-container" *ngIf="job">
      <div class="job-detail-content">
        <div class="job-main">
          <button class="back-btn" (click)="goBack()">
            ← Back to Jobs
          </button>

          <div class="job-header">
            <h1>{{ job.title }}</h1>
            <div class="job-posted">Posted {{ getTimeAgo(job.postedAt) }}</div>
          </div>

          <div class="job-budget-section">
            <div class="budget-card">
              <div class="budget-label">Budget</div>
              <div class="budget-value" *ngIf="job.budget.type === 'fixed'">
                {{ '$' + (job.budget.amount?.toLocaleString() || '') }}
              </div>
              <div class="budget-value" *ngIf="job.budget.type === 'hourly'">
                {{ '$' + job.budget.hourlyRate?.min + '-$' + job.budget.hourlyRate?.max + '/hr' }}
              </div>
              <div class="budget-type">{{ job.budget.type }} price</div>
            </div>
            <div class="info-card">
              <div class="info-label">Experience Level</div>
              <div class="info-value">{{ job.experienceLevel }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Duration</div>
              <div class="info-value">{{ job.duration }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Proposals</div>
              <div class="info-value">{{ job.proposals }}</div>
            </div>
          </div>

          <div class="job-section">
            <h2>Description</h2>
            <p class="description-text">{{ job.description }}</p>
          </div>

          <div class="job-section">
            <h2>Skills Required</h2>
            <div class="skills-list">
              <span class="skill-badge" *ngFor="let skill of job.skills">{{ skill }}</span>
            </div>
          </div>

          <div class="job-section">
            <h2>About the Client</h2>
            <div class="client-card">
              <div class="client-stat">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#fbbf24">
                  <path d="M10 1l2.163 6.615h6.957l-5.628 4.09 2.163 6.615L10 14.23l-5.655 4.09 2.163-6.615L.88 7.615h6.957L10 1z"/>
                </svg>
                <span>{{ job.clientInfo.rating }} Rating</span>
              </div>
              <div class="client-stat">
                <span class="stat-value">{{ '$' + job.clientInfo.totalSpent.toLocaleString() }}</span>
                <span class="stat-label">Total Spent</span>
              </div>
              <div class="client-stat">
                <span class="stat-value">{{ job.clientInfo.location }}</span>
                <span class="stat-label">Location</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="job-sidebar">
          <div class="proposal-card" *ngIf="!showProposalForm">
            <button class="submit-proposal-btn" (click)="showProposalForm = true">
              Submit a Proposal
            </button>
            <p class="proposal-hint">Stand out from {{ job.proposals }} other proposals</p>
          </div>

          <div class="proposal-form-card" *ngIf="showProposalForm">
            <h3>Submit Your Proposal</h3>
            <form (ngSubmit)="submitProposal()">
              <div class="form-group">
                <label>Your Rate</label>
                <div class="rate-input">
                  <span class="currency">$</span>
                  <input 
                    type="number" 
                    [(ngModel)]="proposalRate" 
                    name="rate"
                    placeholder="0">
                  <span class="rate-type" *ngIf="job.budget.type === 'hourly'">/hr</span>
                </div>
              </div>

              <div class="form-group">
                <label>Estimated Duration</label>
                <input 
                  type="text" 
                  [(ngModel)]="proposalDuration" 
                  name="duration"
                  placeholder="e.g., 2 weeks">
              </div>

              <div class="form-group">
                <label>Cover Letter</label>
                <textarea 
                  [(ngModel)]="coverLetter" 
                  name="coverLetter"
                  rows="8"
                  placeholder="Explain why you're the best fit for this job..."
                  required></textarea>
                <div class="char-count">{{ coverLetter.length }} / 500</div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="submitting">
                {{ submitting ? 'Submitting...' : 'Submit Proposal' }}
              </button>
              <button type="button" class="cancel-btn" (click)="cancelProposal()">
                Cancel
              </button>
            </form>
          </div>

          <div class="similar-jobs">
            <h3>Similar Jobs</h3>
            <div class="similar-job" *ngFor="let i of [1,2,3]">
              <h4>Similar Job Title {{ i }}</h4>
              <p>Brief description of the job...</p>
              <span class="similar-budget">$3,000</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

    .job-detail-container {
      font-family: 'DM Sans', sans-serif;
      background: #f8f9fb;
      min-height: 100vh;
      padding: 2rem;
    }

    .job-detail-content {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
    }

    .back-btn {
      background: none;
      border: none;
      color: #00d9ff;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      padding: 0;
      margin-bottom: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;

      &:hover {
        text-decoration: underline;
      }
    }

    .job-main {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 2px 8px rgba(10, 14, 39, 0.04);
    }

    .job-header {
      margin-bottom: 2rem;

      h1 {
        font-family: 'Syne', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: #0a0e27;
        margin-bottom: 0.5rem;
      }

      .job-posted {
        color: #6b7280;
        font-size: 0.95rem;
      }
    }

    .job-budget-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .budget-card, .info-card {
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8f9fb 0%, #e5e7eb 100%);
      border-radius: 12px;
    }

    .budget-label, .info-label {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .budget-value {
      font-family: 'Syne', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #00d9ff;
      margin-bottom: 0.25rem;
    }

    .budget-type {
      font-size: 0.85rem;
      color: #6b7280;
      text-transform: capitalize;
    }

    .info-value {
      font-weight: 600;
      color: #0a0e27;
      font-size: 1.1rem;
      text-transform: capitalize;
    }

    .job-section {
      margin-bottom: 2.5rem;
      
      h2 {
        font-family: 'Syne', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 1rem;
      }
    }

    .description-text {
      color: #4b5563;
      line-height: 1.8;
      font-size: 1.05rem;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .skill-badge {
      padding: 0.625rem 1.25rem;
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .client-card {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      padding: 1.5rem;
      background: #f8f9fb;
      border-radius: 12px;
    }

    .client-stat {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      svg {
        margin-bottom: 0.25rem;
      }

      span {
        color: #6b7280;
      }

      .stat-value {
        font-family: 'Syne', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: #0a0e27;
      }

      .stat-label {
        font-size: 0.85rem;
      }
    }

    .job-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .proposal-card, .proposal-form-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(10, 14, 39, 0.04);
      position: sticky;
      top: 90px;
    }

    .submit-proposal-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      margin-bottom: 0.75rem;
      box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0, 217, 255, 0.4);
      }
    }

    .proposal-hint {
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .proposal-form-card {
      h3 {
        font-family: 'Syne', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 1.5rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      input, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.95rem;

        &:focus {
          outline: none;
          border-color: #00d9ff;
        }
      }

      textarea {
        resize: vertical;
      }
    }

    .rate-input {
      display: flex;
      align-items: center;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;

      &:focus-within {
        border-color: #00d9ff;
      }

      .currency, .rate-type {
        padding: 0.75rem;
        background: #f8f9fb;
        color: #6b7280;
        font-weight: 600;
      }

      input {
        border: none;
        flex: 1;

        &:focus {
          outline: none;
        }
      }
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .submit-btn, .cancel-btn {
      width: 100%;
      padding: 0.875rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .submit-btn {
      background: linear-gradient(135deg, #00d9ff 0%, #0099ff 100%);
      color: white;
      border: none;
      margin-bottom: 0.75rem;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .cancel-btn {
      background: transparent;
      border: 2px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        background: #f8f9fb;
      }
    }

    .similar-jobs {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(10, 14, 39, 0.04);

      h3 {
        font-family: 'Syne', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 1rem;
      }
    }

    .similar-job {
      padding: 1rem 0;
      border-bottom: 1px solid #e5e7eb;

      &:last-child {
        border-bottom: none;
      }

      h4 {
        font-weight: 600;
        color: #0a0e27;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: #6b7280;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
      }

      .similar-budget {
        color: #00d9ff;
        font-weight: 600;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 968px) {
      .job-detail-content {
        grid-template-columns: 1fr;
      }

      .job-budget-section, .client-card {
        grid-template-columns: repeat(2, 1fr);
      }

      .proposal-card, .proposal-form-card {
        position: static;
      }
    }
  `]
})
export class JobDetailComponent implements OnInit {
  job?: Job;
  showProposalForm = false;
  coverLetter = '';
  proposalRate = 0;
  proposalDuration = '';
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private proposalService: ProposalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobService.getJobById(id).subscribe(job => {
        this.job = job;
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }

  submitProposal(): void {
    if (!this.job || !this.authService.getCurrentUser()) return;

    this.submitting = true;
    
    this.proposalService.submitProposal({
      jobId: this.job.id,
      freelancerId: String(this.authService.getCurrentUser()!.id),
      coverLetter: this.coverLetter,
      proposedRate: this.proposalRate,
      estimatedDuration: this.proposalDuration
    }).subscribe({
      next: () => {
        alert('Proposal submitted successfully!');
        this.showProposalForm = false;
        this.resetForm();
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  cancelProposal(): void {
    this.showProposalForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.coverLetter = '';
    this.proposalRate = 0;
    this.proposalDuration = '';
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}
