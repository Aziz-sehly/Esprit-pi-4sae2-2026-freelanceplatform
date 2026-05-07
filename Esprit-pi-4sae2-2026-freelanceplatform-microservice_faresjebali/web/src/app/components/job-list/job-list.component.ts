import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job, JobFilters } from '../../models/models';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="job-list-container">
      <div class="job-list-header">
        <h1>Find Your Next Opportunity</h1>
        <p>Browse thousands of projects and find the perfect match</p>
      </div>

      <div class="job-list-content">
        <aside class="filters-sidebar">
          <div class="filters-header">
            <h3>Filters</h3>
            <button class="clear-btn" (click)="clearFilters()">Clear all</button>
          </div>

          <div class="filter-section">
            <h4>Category</h4>
            <select [(ngModel)]="filters.category" (change)="applyFilters()">
              <option [value]="undefined">All Categories</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="filter-section">
            <h4>Experience Level</h4>
            <label class="checkbox-label" *ngFor="let level of experienceLevels">
              <input 
                type="checkbox" 
                [checked]="isLevelSelected(level.value)"
                (change)="toggleLevel(level.value)">
              <span>{{ level.label }}</span>
            </label>
          </div>

          <div class="filter-section">
            <h4>Project Type</h4>
            <label class="checkbox-label" *ngFor="let type of jobTypes">
              <input 
                type="checkbox" 
                [checked]="isTypeSelected(type.value)"
                (change)="toggleType(type.value)">
              <span>{{ type.label }}</span>
            </label>
          </div>

          <div class="filter-section">
            <h4>Budget Range</h4>
            <div class="budget-inputs">
              <input 
                type="number" 
                [(ngModel)]="filters.budgetMin" 
                placeholder="Min"
                (change)="applyFilters()">
              <span>-</span>
              <input 
                type="number" 
                [(ngModel)]="filters.budgetMax" 
                placeholder="Max"
                (change)="applyFilters()">
            </div>
          </div>
        </aside>

        <div class="jobs-main">
          <div class="jobs-toolbar">
            <div class="results-count">
              <span class="count">{{ totalJobs }}</span> jobs found
            </div>
            <div class="sort-options">
              <select>
                <option>Most Recent</option>
                <option>Highest Budget</option>
                <option>Most Proposals</option>
              </select>
            </div>
          </div>

          <div class="jobs-grid" *ngIf="!loading; else loadingTemplate">
            <div class="job-card" *ngFor="let job of jobs" (click)="viewJob(job.id)">
              <div class="job-card-header">
                <h3 class="job-title">{{ job.title }}</h3>
                <div class="job-budget">
                  <span class="budget-amount" *ngIf="job.budget.type === 'fixed'">
                    {{ '$' + (job.budget.amount?.toLocaleString() || '') }}
                  </span>
                  <span class="budget-amount" *ngIf="job.budget.type === 'hourly'">
                    {{ '$' + job.budget.hourlyRate?.min + '-$' + job.budget.hourlyRate?.max + '/hr' }}
                  </span>
                  <span class="budget-type">{{ job.budget.type }}</span>
                </div>
              </div>

              <p class="job-description">{{ job.description }}</p>

              <div class="job-skills">
                <span class="skill-tag" *ngFor="let skill of job.skills.slice(0, 5)">
                  {{ skill }}
                </span>
                <span class="skill-more" *ngIf="job.skills.length > 5">
                  +{{ job.skills.length - 5 }}
                </span>
              </div>

              <div class="job-meta">
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 14A6 6 0 108 2a6 6 0 000 12z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 4v4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {{ getTimeAgo(job.postedAt) }}
                </div>
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 7l-2-2-6 6-3-3-1 1 4 4z" fill="currentColor"/>
                  </svg>
                  {{ job.proposals }} proposals
                </div>
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a3 3 0 100 6 3 3 0 000-6zM4 11a4 4 0 018 0v3H4v-3z" fill="currentColor"/>
                  </svg>
                  {{ job.experienceLevel }}
                </div>
              </div>

              <div class="job-footer">
                <div class="client-info">
                  <div class="client-rating">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="#fbbf24">
                      <path d="M7 1l1.545 4.755h5l-4.045 2.94 1.545 4.755L7 10.51l-4.045 2.94 1.545-4.755L.455 5.755h5L7 1z"/>
                    </svg>
                    {{ job.clientInfo.rating }}
                  </div>
                  <span class="client-spent">
                    {{ '$' + job.clientInfo.totalSpent.toLocaleString() + ' spent' }}
                  </span>
                  <span class="client-location">{{ job.clientInfo.location }}</span>
                </div>
              </div>
            </div>
          </div>

          <ng-template #loadingTemplate>
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading jobs...</p>
            </div>
          </ng-template>

          <div class="pagination" *ngIf="totalPages > 1">
            <button 
              class="page-btn" 
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)">
              Previous
            </button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              class="page-btn" 
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

    .job-list-container {
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
    }

    .job-list-header {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 3rem 2rem;
      text-align: center;
      color: white;

      h1 {
        font-family: 'Syne', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
      }

      p {
        font-size: 1.125rem;
        opacity: 0.9;
      }
    }

    .job-list-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    .filters-sidebar {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 90px;
      box-shadow: 0 2px 8px rgba(10, 14, 39, 0.04);
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h3 {
        font-family: 'Syne', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #0a0e27;
      }

      .clear-btn {
        background: none;
        border: none;
        color: #00d9ff;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .filter-section {
      margin-bottom: 2rem;

      h4 {
        font-weight: 600;
        color: #0a0e27;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
      }

      select {
        width: 100%;
        padding: 0.625rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        
        &:focus {
          outline: none;
          border-color: #00d9ff;
        }
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #6b7280;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }

      &:hover {
        color: #0a0e27;
      }
    }

    .budget-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      input {
        flex: 1;
        padding: 0.625rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: #00d9ff;
        }
      }

      span {
        color: #9ca3af;
      }
    }

    .jobs-main {
      min-height: 500px;
    }

    .jobs-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 0 0.5rem;
    }

    .results-count {
      font-size: 0.95rem;
      color: #6b7280;

      .count {
        font-weight: 600;
        color: #0a0e27;
      }
    }

    .sort-options select {
      padding: 0.5rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #00d9ff;
      }
    }

    .jobs-grid {
      display: grid;
      gap: 1.5rem;
    }

    .job-card {
      background: white;
      border-radius: 16px;
      padding: 1.75rem;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: #00d9ff;
        box-shadow: 0 8px 24px rgba(0, 217, 255, 0.1);
        transform: translateY(-2px);
      }
    }

    .job-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1.5rem;
    }

    .job-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: #0a0e27;
      margin: 0;
      flex: 1;
    }

    .job-budget {
      text-align: right;
      flex-shrink: 0;

      .budget-amount {
        display: block;
        font-family: 'Syne', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: #00d9ff;
        margin-bottom: 0.25rem;
      }

      .budget-type {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #f8f9fb;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
      }
    }

    .job-description {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .job-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .skill-tag {
      padding: 0.4rem 0.875rem;
      background: linear-gradient(135deg, #f8f9fb 0%, #e5e7eb 50%);
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #0a0e27;
    }

    .skill-more {
      padding: 0.4rem 0.875rem;
      background: #00d9ff;
      color: white;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .job-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #6b7280;

      svg {
        flex-shrink: 0;
      }
    }

    .job-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
    }

    .client-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      color: #0a0e27;
    }

    .client-spent, .client-location {
      color: #6b7280;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;

      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 1rem;
        border: 4px solid #e5e7eb;
        border-top-color: #00d9ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      p {
        color: #6b7280;
        font-size: 1.125rem;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      margin-top: 3rem;
    }

    .page-btn {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #00d9ff;
        color: white;
        border-color: #00d9ff;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-weight: 600;
      color: #0a0e27;
    }

    @media (max-width: 968px) {
      .job-list-content {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        position: static;
      }
    }
  `]
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];
  loading = true;
  totalJobs = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  filters: JobFilters = {};
  categories: string[] = [];
  
  experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];

  jobTypes = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'hourly', label: 'Hourly Rate' }
  ];

  constructor(
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categories = this.jobService.getCategories();
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;
    this.jobService.searchJobs(this.filters, this.currentPage, this.pageSize)
      .subscribe(result => {
        this.jobs = result.items;
        this.totalJobs = result.total;
        this.totalPages = Math.ceil(result.total / this.pageSize);
        this.loading = false;
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  clearFilters(): void {
    this.filters = {};
    this.applyFilters();
  }

  isLevelSelected(level: string): boolean {
    return this.filters.experienceLevel?.includes(level) || false;
  }

  toggleLevel(level: string): void {
    if (!this.filters.experienceLevel) {
      this.filters.experienceLevel = [];
    }
    
    const index = this.filters.experienceLevel.indexOf(level);
    if (index > -1) {
      this.filters.experienceLevel.splice(index, 1);
    } else {
      this.filters.experienceLevel.push(level);
    }
    
    this.applyFilters();
  }

  isTypeSelected(type: string): boolean {
    return this.filters.jobType?.includes(type) || false;
  }

  toggleType(type: string): void {
    if (!this.filters.jobType) {
      this.filters.jobType = [];
    }
    
    const index = this.filters.jobType.indexOf(type);
    if (index > -1) {
      this.filters.jobType.splice(index, 1);
    } else {
      this.filters.jobType.push(type);
    }
    
    this.applyFilters();
  }

  viewJob(id: string): void {
    this.router.navigate(['/jobs', id]);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
