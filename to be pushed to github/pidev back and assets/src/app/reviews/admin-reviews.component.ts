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
  reviewReason?: string;
  bookmarked?: boolean;       // NEW
  helpfulVotes?: number;      // NEW
  sentiment?: string;         // NEW: "positive" | "neutral" | "negative"
}

interface ReviewStats {
  ratingDistribution:    { [star: number]: number };
  reasonDistribution:    { [reason: string]: number };
  sentimentDistribution: { positive: number; neutral: number; negative: number }; // NEW
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="admin-reviews">
      <div class="page-header">
        <h1>Reviews Management</h1>

        <!-- Tab switcher -->
        <div class="tab-row">
          <button class="tab-btn" [class.active]="activeTab === 'list'" (click)="activeTab = 'list'">
            📋 All Reviews
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'stats'" (click)="activeTab = 'stats'; loadStats()">
            📊 Statistics
          </button>
        </div>
      </div>

      <!-- ===== LIST TAB ===== -->
      <ng-container *ngIf="activeTab === 'list'">
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
                  <th>Reason</th>
                  <th>Sentiment</th>
                  <th>Helpful</th>
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
                  <td>
                    <span class="reason-badge" *ngIf="r.reviewReason">{{ r.reviewReason }}</span>
                    <span class="no-reason" *ngIf="!r.reviewReason">—</span>
                  </td>
                  <!-- NEW: Sentiment badge in table -->
                  <td>
                    <span class="sentiment-badge" [class]="'sentiment-' + (r.sentiment || 'neutral')">
                      {{ sentimentIcon(r.sentiment) }} {{ r.sentiment || 'neutral' }}
                    </span>
                  </td>
                  <!-- NEW: Helpful votes count -->
                  <td>
                    <span class="helpful-count">👍 {{ r.helpfulVotes || 0 }}</span>
                  </td>
                  <td class="content-cell">{{ r.content }}</td>
                  <td><span class="lang-badge">{{ r.language || 'en' }}</span></td>
                  <td>{{ r.createdAt | date:'mediumDate' }}</td>
                  <td>
                    <button class="btn-delete" (click)="deleteReview(r.id)">🗑 Delete</button>
                  </td>
                </tr>
                <tr *ngIf="reviews.length === 0">
                  <td colspan="10" class="empty">No reviews found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- ===== STATS TAB ===== -->
      <ng-container *ngIf="activeTab === 'stats'">
        <div class="loading" *ngIf="statsLoading">Loading statistics...</div>

        <div class="stats-page" *ngIf="!statsLoading && stats">

          <!-- Stat summary cards -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-num">{{ reviews.length }}</span>
              <span class="stat-label">Total Reviews</span>
            </div>
            <div class="stat-card highlight">
              <span class="stat-num">⭐ {{ averageRating }}</span>
              <span class="stat-label">Average Rating</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">{{ topReasonLabel }}</span>
              <span class="stat-label">Most Common Reason</span>
            </div>
            <!-- NEW: Top sentiment summary card -->
            <div class="stat-card" [class]="'sentiment-card-' + topSentiment">
              <span class="stat-num">{{ sentimentIcon(topSentiment) }} {{ topSentimentCount }}</span>
              <span class="stat-label">{{ topSentiment | titlecase }} Reviews</span>
            </div>
          </div>

          <!-- Chart 1: Star Rating Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h2>⭐ Star Rating Distribution</h2>
              <p>How many reviews were given each star rating</p>
            </div>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let star of [5,4,3,2,1]">
                <div class="bar-label">
                  <span class="star-emoji" *ngFor="let s of starsArray(star)">★</span>
                  <span class="star-count-label">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    [style.width.%]="getBarWidth(stats.ratingDistribution[star], maxRatingCount)"
                    [class]="'bar-star-' + star">
                  </div>
                </div>
                <div class="bar-count">{{ stats.ratingDistribution[star] || 0 }}</div>
              </div>
            </div>
          </div>

          <!-- Chart 2: Review Reason Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h2>💬 Review Reason Distribution</h2>
              <p>Why users chose to leave their review</p>
            </div>

            <div class="empty-reasons" *ngIf="reasonEntries.length === 0">
              No reason data yet. Reasons will appear once users submit reviews with a selected reason.
            </div>

            <div class="reason-chart" *ngIf="reasonEntries.length > 0">
              <div class="reason-row" *ngFor="let entry of reasonEntries; let i = index">
                <div class="reason-label">{{ entry.reason }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill reason-bar"
                    [style.width.%]="getBarWidth(entry.count, maxReasonCount)"
                    [class]="'reason-color-' + (i % 6)">
                  </div>
                </div>
                <div class="bar-count">{{ entry.count }}</div>
              </div>
            </div>

            <!-- Percentage pills -->
            <div class="reason-pills" *ngIf="reasonEntries.length > 0">
              <div class="reason-pill" *ngFor="let entry of reasonEntries; let i = index"
                   [class]="'pill-color-' + (i % 6)">
                <span class="pill-reason">{{ entry.reason }}</span>
                <span class="pill-pct">{{ getPercentage(entry.count, totalReasonCount) }}%</span>
              </div>
            </div>
          </div>

          <!-- NEW: Chart 3: Sentiment Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h2>🧠 Sentiment Distribution</h2>
              <p>Automatic sentiment analysis based on review content keywords</p>
            </div>

            <div class="sentiment-chart">
              <!-- Positive -->
              <div class="sentiment-row">
                <div class="sentiment-row-label">
                  <span class="sentiment-badge sentiment-positive">😊 positive</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill sentiment-bar-positive"
                    [style.width.%]="getBarWidth(stats.sentimentDistribution.positive, maxSentimentCount)">
                  </div>
                </div>
                <div class="bar-count">{{ stats.sentimentDistribution.positive }}</div>
              </div>

              <!-- Neutral -->
              <div class="sentiment-row">
                <div class="sentiment-row-label">
                  <span class="sentiment-badge sentiment-neutral">😐 neutral</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill sentiment-bar-neutral"
                    [style.width.%]="getBarWidth(stats.sentimentDistribution.neutral, maxSentimentCount)">
                  </div>
                </div>
                <div class="bar-count">{{ stats.sentimentDistribution.neutral }}</div>
              </div>

              <!-- Negative -->
              <div class="sentiment-row">
                <div class="sentiment-row-label">
                  <span class="sentiment-badge sentiment-negative">😞 negative</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill sentiment-bar-negative"
                    [style.width.%]="getBarWidth(stats.sentimentDistribution.negative, maxSentimentCount)">
                  </div>
                </div>
                <div class="bar-count">{{ stats.sentimentDistribution.negative }}</div>
              </div>
            </div>

            <!-- Sentiment percentage pills -->
            <div class="reason-pills" *ngIf="totalSentimentCount > 0">
              <div class="reason-pill pill-sentiment-positive">
                <span class="pill-reason">😊 Positive</span>
                <span class="pill-pct">{{ getPercentage(stats.sentimentDistribution.positive, totalSentimentCount) }}%</span>
              </div>
              <div class="reason-pill pill-sentiment-neutral">
                <span class="pill-reason">😐 Neutral</span>
                <span class="pill-pct">{{ getPercentage(stats.sentimentDistribution.neutral, totalSentimentCount) }}%</span>
              </div>
              <div class="reason-pill pill-sentiment-negative">
                <span class="pill-reason">😞 Negative</span>
                <span class="pill-pct">{{ getPercentage(stats.sentimentDistribution.negative, totalSentimentCount) }}%</span>
              </div>
            </div>

            <div class="empty-reasons" *ngIf="totalSentimentCount === 0">
              No sentiment data yet. Sentiment is calculated automatically when reviews are submitted.
            </div>
          </div>

        </div>
      </ng-container>
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

    .tab-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      padding: 0.6rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      background: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
      font-family: inherit;

      &.active {
        border-color: #0a0e27;
        background: #0a0e27;
        color: white;
      }

      &:hover:not(.active) {
        border-color: #9ca3af;
        color: #374151;
      }
    }

    .stats-row {
      display: flex;
      gap: 1.25rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
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
      max-width: 220px;

      &.highlight { background: linear-gradient(135deg, #0a0e27, #1a1f3a); color: white; }
    }

    /* NEW: sentiment summary card colour variants */
    .sentiment-card-positive { background: #d1fae5; }
    .sentiment-card-neutral  { background: #f3f4f6; }
    .sentiment-card-negative { background: #fee2e2; }

    .stat-num {
      font-size: 1.7rem;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
    }

    .stat-label {
      font-size: 0.82rem;
      opacity: 0.75;
      margin-top: 4px;
      text-align: center;
    }

    /* List tab */
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

    .reason-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      display: inline-block;
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-reason { color: #d1d5db; }

    /* NEW: Sentiment badge — used in both table and chart */
    .sentiment-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: capitalize;
    }

    .sentiment-positive { background: #d1fae5; color: #065f46; }
    .sentiment-neutral  { background: #f3f4f6; color: #4b5563; }
    .sentiment-negative { background: #fee2e2; color: #991b1b; }

    /* NEW: Helpful votes count in table */
    .helpful-count {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .content-cell {
      max-width: 200px;
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
      white-space: nowrap;
      &:hover { background: #fecaca; }
    }

    .empty {
      text-align: center;
      color: #9ca3af;
      padding: 3rem !important;
    }

    /* ===== STATS PAGE ===== */
    .stats-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(10,14,39,0.07);
      padding: 2rem;
    }

    .chart-header {
      margin-bottom: 1.75rem;
      h2 { font-size: 1.25rem; font-weight: 700; color: #0a0e27; margin-bottom: 0.25rem; }
      p { font-size: 0.875rem; color: #9ca3af; }
    }

    /* Shared bar chart layout */
    .bar-chart    { display: flex; flex-direction: column; gap: 0.85rem; }
    .reason-chart { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem; }

    /* NEW: sentiment chart rows — same grid as reason rows */
    .sentiment-chart {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1.5rem;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 160px 1fr 50px;
      align-items: center;
      gap: 1rem;
    }

    .reason-row {
      display: grid;
      grid-template-columns: 260px 1fr 50px;
      align-items: center;
      gap: 1rem;
    }

    /* NEW: sentiment rows use same width as reason rows for visual consistency */
    .sentiment-row {
      display: grid;
      grid-template-columns: 160px 1fr 50px;
      align-items: center;
      gap: 1rem;
    }

    .sentiment-row-label {
      display: flex;
      align-items: center;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      .star-emoji { color: #f59e0b; font-size: 0.9rem; }
      .star-count-label { font-size: 0.875rem; color: #374151; font-weight: 500; }
    }

    .reason-label {
      font-size: 0.85rem;
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-track {
      background: #f3f4f6;
      border-radius: 999px;
      height: 24px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.6s ease;
      min-width: 4px;
    }

    /* Star rating colours */
    .bar-star-5 { background: linear-gradient(90deg, #10b981, #059669); }
    .bar-star-4 { background: linear-gradient(90deg, #34d399, #10b981); }
    .bar-star-3 { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
    .bar-star-2 { background: linear-gradient(90deg, #fb923c, #f97316); }
    .bar-star-1 { background: linear-gradient(90deg, #f87171, #ef4444); }

    /* Reason bar colours */
    .reason-color-0 { background: linear-gradient(90deg, #6366f1, #4f46e5); }
    .reason-color-1 { background: linear-gradient(90deg, #0ea5e9, #0284c7); }
    .reason-color-2 { background: linear-gradient(90deg, #10b981, #059669); }
    .reason-color-3 { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .reason-color-4 { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .reason-color-5 { background: linear-gradient(90deg, #ec4899, #db2777); }

    /* NEW: Sentiment bar colours — match badge colours */
    .sentiment-bar-positive { background: linear-gradient(90deg, #34d399, #10b981); }
    .sentiment-bar-neutral  { background: linear-gradient(90deg, #9ca3af, #6b7280); }
    .sentiment-bar-negative { background: linear-gradient(90deg, #f87171, #ef4444); }

    .reason-bar { min-width: 4px; }

    .bar-count {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0a0e27;
      text-align: right;
    }

    /* Percentage pills */
    .reason-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f3f4f6;
    }

    .reason-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Reason pill colours */
    .pill-color-0 { background: #eef2ff; color: #4f46e5; }
    .pill-color-1 { background: #e0f2fe; color: #0284c7; }
    .pill-color-2 { background: #d1fae5; color: #059669; }
    .pill-color-3 { background: #fef3c7; color: #d97706; }
    .pill-color-4 { background: #fee2e2; color: #dc2626; }
    .pill-color-5 { background: #fce7f3; color: #db2777; }

    /* NEW: Sentiment pill colours — match badge colours */
    .pill-sentiment-positive { background: #d1fae5; color: #065f46; }
    .pill-sentiment-neutral  { background: #f3f4f6; color: #4b5563; }
    .pill-sentiment-negative { background: #fee2e2; color: #991b1b; }

    .pill-reason { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pill-pct { font-size: 0.9rem; font-weight: 700; }

    .empty-reasons {
      color: #9ca3af;
      font-size: 0.9rem;
      padding: 1.5rem 0;
      text-align: center;
    }
  `]
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  averageRating = 0;
  loading = true;
  activeTab: 'list' | 'stats' = 'list';

  stats: ReviewStats | null = null;
  statsLoading = false;

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

  loadStats() {
    if (this.stats) return; // already loaded — avoid redundant request
    this.statsLoading = true;
    this.http.get<ReviewStats>(`${this.api}/stats`).subscribe({
      next: (data) => { this.stats = data; this.statsLoading = false; },
      error: () => { this.statsLoading = false; }
    });
  }

  deleteReview(id: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.http.delete(`${this.api}/${id}`).subscribe(() => {
      this.reviews = this.reviews.filter(r => r.id !== id);
      this.stats = null; // invalidate cached stats so they reload fresh
    });
  }

  // ── NEW: Sentiment helpers ────────────────────────────────────────

  // Returns the right emoji for a given sentiment string
  sentimentIcon(sentiment?: string): string {
    if (sentiment === 'positive') return '😊';
    if (sentiment === 'negative') return '😞';
    return '😐';
  }

  // The sentiment with the highest count (used in the summary card)
  get topSentiment(): string {
    if (!this.stats) return 'neutral';
    const d = this.stats.sentimentDistribution;
    if (d.positive >= d.neutral && d.positive >= d.negative) return 'positive';
    if (d.negative >= d.neutral && d.negative >= d.positive) return 'negative';
    return 'neutral';
  }

  get topSentimentCount(): number {
    if (!this.stats) return 0;
    return this.stats.sentimentDistribution[this.topSentiment as keyof typeof this.stats.sentimentDistribution] ?? 0;
  }

  // Total reviews that have a sentiment value (for percentage calculations)
  get totalSentimentCount(): number {
    if (!this.stats) return 0;
    const d = this.stats.sentimentDistribution;
    return d.positive + d.neutral + d.negative;
  }

  // The highest count across all three sentiments (used to scale bar widths)
  get maxSentimentCount(): number {
    if (!this.stats) return 1;
    const d = this.stats.sentimentDistribution;
    return Math.max(d.positive, d.neutral, d.negative, 1);
  }

  // ── Existing helpers ──────────────────────────────────────────────

  stars(rating: number): number[] { return Array(Math.floor(rating)).fill(0); }
  emptyStars(rating: number): number[] { return Array(5 - Math.floor(rating)).fill(0); }
  starsArray(n: number): number[] { return Array(n).fill(0); }

  get maxRatingCount(): number {
    if (!this.stats) return 1;
    return Math.max(...Object.values(this.stats.ratingDistribution), 1);
  }

  get reasonEntries(): { reason: string; count: number }[] {
    if (!this.stats) return [];
    return Object.entries(this.stats.reasonDistribution)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }

  get maxReasonCount(): number {
    const entries = this.reasonEntries;
    return entries.length > 0 ? Math.max(...entries.map(e => e.count), 1) : 1;
  }

  get topReasonLabel(): string {
    const entries = this.reasonEntries;
    return entries.length > 0 ? entries[0].reason : 'N/A';
  }

  get totalReasonCount(): number {
    return this.reasonEntries.reduce((sum, e) => sum + e.count, 0);
  }

  // Scale a value to a percentage of max, used for bar widths
  getBarWidth(value: number, max: number): number {
    if (!max) return 0;
    return Math.round((value / max) * 100);
  }

  // Calculate a percentage of total (used for pills)
  getPercentage(count: number, total: number): number {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }
}