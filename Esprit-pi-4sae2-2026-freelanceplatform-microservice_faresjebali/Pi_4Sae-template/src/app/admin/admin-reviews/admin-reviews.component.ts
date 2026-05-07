import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Review {
  id: number;
  author: string;
  content: string;
  rating: number;
  averageRating: number;
  createdAt: string;
  language: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="admin-reviews">
      <div class="page-header">
        <h1>Reviews Management</h1>
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">{{ reviews.length }}</span>
            <span class="stat-label">Total Reviews</span>
          </div>
          <div class="stat-card highlight">
            <span class="stat-num">⭐ {{ averageRating }}</span>
            <span class="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-head">
          <h2>All Reviews</h2>
        </div>

        <div class="loading" *ngIf="loading">Loading...</div>

        <div class="table-wrapper" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Language</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of reviews">
                <td>#{{ r.id }}</td>
                <td>
                  <div class="author-cell">
                    <div class="avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
                    <span>{{ r.author }}</span>
                  </div>
                </td>
                <td>
                  <div class="stars">
                    <span *ngFor="let s of stars(r.rating)" class="star filled">★</span>
                    <span *ngFor="let s of emptyStars(r.rating)" class="star empty">★</span>
                  </div>
                </td>
                <td class="content-cell">{{ r.content }}</td>
                <td><span class="lang-badge">{{ r.language || 'en' }}</span></td>
                <td>{{ r.createdAt | date:'mediumDate' }}</td>
                <td>
                  <button class="btn-delete" (click)="deleteReview(r.id)">🗑 Delete</button>
                </td>
              </tr>
              <tr *ngIf="reviews.length === 0">
                <td colspan="7" class="empty">No reviews found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-reviews {
      padding: 2rem;
      font-family: 'DM Sans', sans-serif;
    }

    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #0a0e27;
      margin-bottom: 1.5rem;
    }

    .stats-row {
      display: flex;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 1.25rem 2rem;
      box-shadow: 0 2px 12px rgba(10,14,39,0.07);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 140px;

      &.highlight { background: linear-gradient(135deg, #0a0e27, #1a1f3a); color: white; }
    }

    .stat-num {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.85rem;
      opacity: 0.75;
      margin-top: 4px;
    }

    .card-box {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(10,14,39,0.07);
      overflow: hidden;
    }

    .card-head {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f3f4f6;
      h2 { font-size: 1.2rem; font-weight: 600; color: #0a0e27; }
    }

    .loading {
      padding: 3rem;
      text-align: center;
      color: #9ca3af;
    }

    .table-wrapper { overflow-x: auto; }

    table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: #f8f9fb;
        padding: 0.9rem 1.25rem;
        text-align: left;
        font-size: 0.8rem;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }

      td {
        padding: 1rem 1.25rem;
        border-top: 1px solid #f3f4f6;
        color: #374151;
        font-size: 0.95rem;
        vertical-align: middle;
      }
    }

    .author-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stars { display: flex; gap: 2px; }
    .star { font-size: 1rem; }
    .star.filled { color: #f59e0b; }
    .star.empty { color: #d1d5db; }

    .content-cell {
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lang-badge {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .btn-delete {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      padding: 0.4rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
      &:hover { background: #fecaca; }
    }

    .empty {
      text-align: center;
      color: #9ca3af;
      padding: 3rem !important;
    }
  `]
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  averageRating = 0;
  loading = true;
  private api = 'http://localhost:8081/api/reviews';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<Review[]>(this.api).subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.http.get<{ averageRating: number }>(`${this.api}/average`).subscribe({
      next: (d) => { this.averageRating = d.averageRating; }
    });
  }

  deleteReview(id: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.http.delete(`${this.api}/${id}`).subscribe(() => {
      this.reviews = this.reviews.filter(r => r.id !== id);
    });
  }

  stars(rating: number): number[] { return Array(Math.floor(rating)).fill(0); }
  emptyStars(rating: number): number[] { return Array(5 - Math.floor(rating)).fill(0); }
}