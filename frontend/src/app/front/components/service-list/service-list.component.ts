import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FreelancerService, ServicesService } from '../../services/services.service';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule],
  template: `
    <!-- Hero -->
    <div class="marketplace-hero">
      <div class="hero-content">
        <h1>Services Marketplace</h1>
        <p>Discover top freelancers and hire the perfect talent for your project</p>
        <div class="hero-search">
          <i class="ri-search-line search-icon"></i>
          <input class="hero-input" [(ngModel)]="searchTerm" (input)="filterServices()"
                 placeholder="Search for services, skills, or freelancers...">
          <button class="hero-search-btn" (click)="filterServices()">Search</button>
        </div>
      </div>
    </div>

    <!-- Category pills -->
    <div class="category-bar">
      <button class="cat-pill" [class.active]="selectedCategory === ''" (click)="setCategory('')">All</button>
      <button class="cat-pill" *ngFor="let cat of categories"
              [class.active]="selectedCategory === cat"
              (click)="setCategory(cat)">
        <i [class]="catIcon(cat)"></i> {{cat}}
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar" *ngIf="!loading && !apiError">
      <span class="result-count">
        <strong>{{filteredServices.length}}</strong> services found
        <span *ngIf="selectedCategory"> in <strong>{{selectedCategory}}</strong></span>
      </span>
      <div class="sort-row">
        <label class="sort-label">Sort by:</label>
        <select class="sort-select" [(ngModel)]="sortBy" (change)="sortServices()">
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div class="center-loading" *ngIf="loading">
      <mat-spinner diameter="44"></mat-spinner>
      <span>Loading services...</span>
    </div>

    <!-- API Error State -->
    <div class="error-state" *ngIf="!loading && apiError">
      <div class="error-icon"><i class="ri-wifi-off-line"></i></div>
      <h3>Could not load services</h3>
      <p>{{ apiError }}</p>
      <button class="btn-retry" (click)="loadServices()">
        <i class="ri-refresh-line"></i> Try Again
      </button>
    </div>

    <!-- Grid -->
    <div class="services-grid" *ngIf="!loading && !apiError && filteredServices.length > 0">
      <a class="svc-card" *ngFor="let s of filteredServices"
         [routerLink]="['/services', s.slug]">
        <div class="svc-card-image">
          <img [src]="getFirstImage(s.mediaUrls)" [alt]="s.title" (error)="onImgError($event)">
          <span class="svc-category-badge">{{s.category}}</span>
        </div>
        <div class="svc-card-body">
          <h3 class="svc-title">{{s.title}}</h3>
          <p class="svc-desc">{{s.description | slice:0:90}}{{s.description && s.description.length > 90 ? '...' : ''}}</p>
          <div class="svc-footer">
            <div class="svc-delivery">
              <i class="ri-time-line"></i> {{ s.deliveryTimeDays }} days
            </div>
            <div class="svc-price">
              <span class="price-from">from</span>
              <span class="price-val">{{ '$' + s.price }}</span>
            </div>
          </div>
        </div>
        <div class="svc-card-cta">
          View Details <i class="ri-arrow-right-line"></i>
        </div>
      </a>
    </div>

    <!-- Empty — no results but API worked fine -->
    <div class="empty-state" *ngIf="!loading && !apiError && filteredServices.length === 0 && services.length > 0">
      <i class="ri-search-line"></i>
      <h3>No services match your search</h3>
      <p>Try adjusting your search or browse a different category</p>
      <button class="btn-reset" (click)="resetFilters()">Clear Filters</button>
    </div>

    <!-- Empty — API returned zero services -->
    <div class="empty-state" *ngIf="!loading && !apiError && services.length === 0">
      <i class="ri-store-3-line"></i>
      <h3>No services available yet</h3>
      <p>Services appear here once a freelancer creates and submits one for review and it gets approved.</p>
    </div>
  `,
  styles: [`
    /* Hero */
    .marketplace-hero {
      background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);
      border-radius:20px;padding:52px 40px;margin-bottom:28px;text-align:center;
      position:relative;overflow:hidden;
      &::before{
        content:'';position:absolute;inset:0;
        background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    }
    .hero-content { position:relative; }
    .hero-content h1 { margin:0 0 10px;font-size:32px;font-weight:800;color:white; }
    .hero-content p  { margin:0 0 28px;font-size:16px;color:rgba(255,255,255,.8); }
    .hero-search {
      display:flex;align-items:center;background:white;border-radius:12px;
      padding:6px 6px 6px 16px;max-width:560px;margin:0 auto;
      box-shadow:0 8px 32px rgba(0,0,0,.15);
    }
    .search-icon { font-size:18px;color:#9ca3af;margin-right:10px;flex-shrink:0; }
    .hero-input {
      flex:1;border:none;outline:none;font-size:15px;color:#111827;background:transparent;
      &::placeholder{color:#9ca3af;}
    }
    .hero-search-btn {
      background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;
      border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;
      transition:opacity .2s;white-space:nowrap;
      &:hover{opacity:.9;}
    }

    /* Category bar */
    .category-bar { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px; }
    .cat-pill {
      background:white;color:#374151;border:1.5px solid #e5e7eb;border-radius:20px;
      padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;
      display:flex;align-items:center;gap:6px;transition:all .15s;
      box-shadow:0 1px 3px rgba(0,0,0,.04);
      &:hover{border-color:#6366f1;color:#6366f1;}
      &.active{background:#6366f1;color:white;border-color:#6366f1;
               box-shadow:0 2px 8px rgba(99,102,241,.3);}
      i{font-size:14px;}
    }

    /* Toolbar */
    .toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:22px; }
    .result-count { font-size:14px;color:#6b7280; strong{color:#111827;} }
    .sort-row { display:flex;align-items:center;gap:10px; }
    .sort-label { font-size:13px;color:#6b7280;font-weight:500; }
    .sort-select {
      border:1.5px solid #e5e7eb;border-radius:8px;padding:7px 14px;
      font-size:13px;color:#374151;background:white;outline:none;cursor:pointer;
      &:focus{border-color:#6366f1;}
    }

    /* Loading */
    .center-loading {
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:80px 0;gap:14px;color:#6b7280;font-size:14px;
    }

    /* Error state */
    .error-state {
      text-align:center;padding:70px 20px;
      .error-icon {
        width:72px;height:72px;border-radius:50%;background:#fee2e2;
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 16px;
        i{font-size:30px;color:#dc2626;}
      }
      h3{font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;}
      p{color:#6b7280;font-size:14px;margin:0 0 22px;}
    }
    .btn-retry {
      background:#6366f1;color:white;border:none;border-radius:10px;
      padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;
      display:inline-flex;align-items:center;gap:7px;transition:opacity .15s;
      &:hover{opacity:.9;}
      i{font-size:16px;}
    }

    /* Grid */
    .services-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px; }
    .svc-card {
      background:white;border-radius:16px;overflow:hidden;
      border:1px solid #f3f4f6;text-decoration:none;color:inherit;
      display:flex;flex-direction:column;
      box-shadow:0 1px 3px rgba(0,0,0,.04);
      transition:box-shadow .2s,transform .2s;
      &:hover{
        box-shadow:0 12px 32px rgba(0,0,0,.1);
        transform:translateY(-3px);
        .svc-card-cta{background:#6366f1;color:white;}
      }
    }
    .svc-card-image {
      position:relative;height:180px;overflow:hidden;background:#f9fafb;
      img{width:100%;height:100%;object-fit:cover;transition:transform .3s;}
      &:hover img{transform:scale(1.04);}
    }
    .svc-category-badge {
      position:absolute;bottom:10px;left:10px;
      background:rgba(99,102,241,.9);color:white;
      padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;
      backdrop-filter:blur(4px);
    }
    .svc-card-body { padding:16px;flex:1; }
    .svc-title {
      margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;
      line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;
      -webkit-box-orient:vertical;overflow:hidden;
    }
    .svc-desc { margin:0 0 14px;font-size:13px;color:#6b7280;line-height:1.5; }
    .svc-footer {
      display:flex;align-items:center;justify-content:space-between;
      padding-top:12px;border-top:1px solid #f3f4f6;
    }
    .svc-delivery { font-size:13px;color:#6b7280;display:flex;align-items:center;gap:4px; }
    .svc-price { display:flex;align-items:baseline;gap:4px; }
    .price-from { font-size:11px;color:#9ca3af; }
    .price-val  { font-size:18px;font-weight:700;color:#6366f1; }
    .svc-card-cta {
      padding:12px 16px;font-size:13px;font-weight:600;color:#6366f1;
      border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:center;
      gap:6px;transition:all .2s;
      i{font-size:15px;}
    }

    /* Empty */
    .empty-state {
      text-align:center;padding:80px 20px;
      i{font-size:52px;color:#d1d5db;display:block;margin-bottom:14px;}
      h3{font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;}
      p{color:#6b7280;font-size:15px;margin:0 0 24px;max-width:400px;margin-left:auto;margin-right:auto;}
    }
    .btn-reset {
      background:white;color:#6366f1;border:1.5px solid #6366f1;
      border-radius:10px;padding:10px 24px;font-size:14px;font-weight:600;
      cursor:pointer;transition:all .15s;
      &:hover{background:#ede9fe;}
    }

    @media(max-width:768px){
      .marketplace-hero{padding:36px 20px;}
      .hero-content h1{font-size:24px;}
      .services-grid{grid-template-columns:1fr;}
      .toolbar{flex-direction:column;gap:12px;align-items:flex-start;}
    }
  `]
})
export class ServiceListComponent implements OnInit {
  services: FreelancerService[] = [];
  filteredServices: FreelancerService[] = [];
  loading = false;
  apiError = '';
  searchTerm = '';
  selectedCategory = '';
  sortBy = 'newest';

  categories = ['Design','Development','Marketing','Writing','Video & Animation','Music & Audio','Business','Data'];

  readonly catIcons: Record<string, string> = {
    'Design': 'ri-palette-line', 'Development': 'ri-code-line', 'Marketing': 'ri-megaphone-line',
    'Writing': 'ri-quill-pen-line', 'Video & Animation': 'ri-movie-line',
    'Music & Audio': 'ri-music-line', 'Business': 'ri-briefcase-line', 'Data': 'ri-database-line'
  };

  constructor(
    private servicesService: ServicesService,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit(): void { this.loadServices(); }

  loadServices(): void {
    this.loading = true;
    this.apiError = '';
    this.servicesService.getActiveServices().subscribe({
      next: (s) => {
        console.log(`[ServiceList] API returned ${s.length} services:`, s);
        this.services = s;
        this.filteredServices = [...s];
        this.sortServices();
        this.loading = false;
      },
      error: (err) => {
        console.error('[ServiceList] API error:', err);
        // Show a meaningful message based on the HTTP status
        if (err?.status === 0) {
          this.apiError = 'Cannot reach the server. Make sure your backend is running on port 8085.';
        } else if (err?.status === 401) {
          this.apiError = 'Authentication required. Please log in.';
        } else if (err?.status === 403) {
          this.apiError = 'Access denied.';
        } else {
          this.apiError = err?.error?.message || `Server error (${err?.status || 'unknown'})`;
        }
        this.loading = false;
      }
    });
  }

  setCategory(cat: string): void { this.selectedCategory = cat; this.filterServices(); }

  filterServices(): void {
    let f = [...this.services];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      f = f.filter(s =>
        s.title.toLowerCase().includes(t) ||
        s.description.toLowerCase().includes(t) ||
        (s.tags?.toLowerCase().includes(t) ?? false)
      );
    }
    if (this.selectedCategory) {
      f = f.filter(s => s.category === this.selectedCategory);
    }
    this.filteredServices = f;
    this.sortServices();
  }

  sortServices(): void {
    this.filteredServices = [...this.filteredServices].sort((a, b) => {
      if (this.sortBy === 'price_low') return a.price - b.price;
      if (this.sortBy === 'price_high') return b.price - a.price;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  resetFilters(): void { this.searchTerm = ''; this.selectedCategory = ''; this.filterServices(); }

  catIcon(cat: string): string { return this.catIcons[cat] || 'ri-apps-line'; }

  getFirstImage(mediaUrls?: string): string {
    if (!mediaUrls) return 'images/users/user15.jpg';
    return mediaUrls.split(',')[0].trim() || 'images/users/user15.jpg';
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).src = 'images/users/user15.jpg'; }
}