import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { Review } from './review.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reviews-page">

      <!-- Hero -->
      <section class="reviews-hero">
        <div class="hero-inner">
          <h1>What People Are Saying</h1>
          <p>Honest reviews from our freelancer community</p>
          <div class="avg-badge" *ngIf="averageRating > 0">
            <div class="stars-display">
              <span *ngFor="let s of starsArray(averageRating)" class="star filled">★</span>
              <span *ngFor="let s of emptyStarsArray(averageRating)" class="star empty">★</span>
            </div>
            <span class="avg-number">{{ averageRating }} / 5 average</span>
          </div>
        </div>
      </section>

      <div class="reviews-body">

        <!-- Write a review -->
        <section class="write-review-card">
          <h2>{{ editingId ? 'Edit Review' : 'Write a Review' }}</h2>
          <div class="form-group">
            <label>Your Name</label>
            <input [(ngModel)]="form.author" placeholder="e.g. Alice Martin" />
          </div>
          <div class="form-group">
            <label>Rating</label>
            <div class="star-picker">
              <span
                *ngFor="let n of [1,2,3,4,5]"
                class="star-btn"
                [class.active]="n <= form.rating"
                (click)="form.rating = n">★</span>
            </div>
          </div>
          <div class="form-group">
            <label>Your Review</label>
            <textarea [(ngModel)]="form.content" rows="4" placeholder="Share your experience..."></textarea>
          </div>
          <div class="form-group">
            <label>Language</label>
            <select [(ngModel)]="form.language">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-submit" (click)="submitReview()" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : (editingId ? 'Update Review' : 'Submit Review') }}
            </button>
            <button class="btn-cancel" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
          </div>
          <p class="success-msg" *ngIf="successMsg">{{ successMsg }}</p>
        </section>

        <!-- Reviews list -->
        <section class="reviews-list">
          <div class="list-header">
            <h2>All Reviews <span class="count">({{ reviews.length }})</span></h2>
          </div>

          <div class="loading" *ngIf="loading">Loading reviews...</div>
          <div class="empty" *ngIf="!loading && reviews.length === 0">No reviews yet. Be the first!</div>

          <div class="review-card" *ngFor="let r of reviews">
            <div class="review-top">
              <div class="avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
              <div class="review-meta">
                <strong>{{ r.author }}</strong>
                <div class="stars">
                  <span *ngFor="let s of starsArray(r.rating)" class="star filled">★</span>
                  <span *ngFor="let s of emptyStarsArray(r.rating)" class="star empty">★</span>
                </div>
                <span class="date">{{ r.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="review-actions">
                <button class="btn-icon" (click)="startEdit(r)" title="Edit">✏️</button>
              </div>
            </div>

            <p class="review-content">{{ r.content }}</p>

            <!-- Translation -->
            <div class="translate-section">
              <select [(ngModel)]="translateTarget[r.id!]">
                <option value="">Translate to...</option>
                <option value="fr">French</option>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
              <button class="btn-translate" (click)="translate(r)" [disabled]="translating[r.id!]">
                {{ translating[r.id!] ? 'Translating...' : 'Translate' }}
              </button>
              <p class="translated-text" *ngIf="translations[r.id!]">
                <em>{{ translations[r.id!] }}</em>
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reviews-page { font-family: 'DM Sans', sans-serif; background: #f8f9fb; min-height: 100vh; }

    .reviews-hero {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 5rem 2rem;
      text-align: center;
      color: #f1f5f9;
    }
    .hero-inner h1 {
      font-family: 'Syne', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .hero-inner p { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }
    .avg-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.1);
      padding: 1rem 2rem;
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .stars-display { display: flex; gap: 4px; font-size: 1.8rem; }
    .avg-number { font-size: 1.1rem; font-weight: 600; }

    .reviews-body {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .write-review-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 4px 24px rgba(10,14,39,0.08);
      color: #0f172a;

      h2 {
        font-family: 'Syne', sans-serif;
        font-size: 1.6rem;
        color: #0a0e27;
        margin-bottom: 1.5rem;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;
      label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
      }
      input, textarea, select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        font-family: inherit;
        transition: border-color 0.2s;
        background: white;
        &:focus { outline: none; border-color: #00d9ff; }
      }
      textarea { resize: vertical; }
    }

    .star-picker {
      display: flex;
      gap: 6px;
      .star-btn {
        font-size: 2rem;
        cursor: pointer;
        color: #d1d5db;
        transition: color 0.15s, transform 0.15s;
        &.active { color: #f59e0b; }
        &:hover { transform: scale(1.2); }
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .btn-submit {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: #0f172a;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: 0.9; }
    }

    .btn-cancel {
      padding: 0.75rem 2rem;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #e5e7eb; }
    }

    .success-msg { margin-top: 1rem; color: #10b981; font-weight: 600; }

    .reviews-list h2 {
      font-family: 'Syne', sans-serif;
      font-size: 1.6rem;
      color: #0a0e27;
      margin-bottom: 1.5rem;
      .count { color: #6b7280; font-size: 1.2rem; }
    }

    .loading, .empty {
      text-align: center;
      color: #6b7280;
      padding: 3rem;
      font-size: 1.1rem;
    }

    .review-card {
      background: white;
      border-radius: 16px;
      color: #0f172a;
      padding: 2rem;
      box-shadow: 0 2px 12px rgba(10,14,39,0.06);
      margin-bottom: 1.25rem;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 6px 24px rgba(10,14,39,0.1); }
    }

    .review-top {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d9ff, #ff006e);
      color: #0f172a;
      font-weight: 700;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .review-meta {
      flex: 1;
      strong { display: block; color: #0a0e27; font-size: 1rem; margin-bottom: 4px; }
      .date { font-size: 0.85rem; color: #9ca3af; margin-top: 4px; display: block; }
    }

    .stars { display: flex; gap: 3px; }
    .star { font-size: 1.1rem; }
    .star.filled { color: #f59e0b; }
    .star.empty { color: #d1d5db; }

    .review-actions { margin-left: auto; }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px 8px;
      border-radius: 8px;
      &:hover { background: #f3f4f6; }
    }

    .review-content {
      color: #374151;
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .translate-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;

      select {
        padding: 0.4rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        background: white;
      }
    }

    .btn-translate {
      padding: 0.4rem 1rem;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      font-weight: 600;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:hover:not(:disabled) { background: #e5e7eb; }
    }

    .translated-text {
      width: 100%;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.95rem;
      background: #f8f9fb;
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }
  `]
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  averageRating = 0;
  loading = true;
  submitting = false;
  successMsg = '';
  editingId: number | null = null;
  translateTarget: { [id: number]: string } = {};
  translations: { [id: number]: string } = {};
  translating: { [id: number]: boolean } = {};

  form: Review = { author: '', content: '', rating: 5, language: 'en' };

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.reviewService.getAll().subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.reviewService.getAverageRating().subscribe({
      next: (data) => { this.averageRating = data.averageRating; }
    });
  }

  submitReview() {
    if (!this.form.author || !this.form.content || !this.form.rating) return;
    this.submitting = true;
    const action = this.editingId
      ? this.reviewService.update(this.editingId, this.form)
      : this.reviewService.create(this.form);

    action.subscribe({
      next: () => {
        this.submitting = false;
        this.successMsg = this.editingId ? 'Review updated!' : 'Review submitted!';
        this.resetForm();
        this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.submitting = false; }
    });
  }

  startEdit(r: Review) {
    this.editingId = r.id!;
    this.form = { ...r };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  resetForm() {
    this.editingId = null;
    this.form = { author: '', content: '', rating: 5, language: 'en' };
  }

  async translate(r: Review) {
    const target = this.translateTarget[r.id!];
    if (!target || !r.content) return;

    this.translating[r.id!] = true;
    this.translations[r.id!] = '';

    try {
      // Calls our backend which proxies LibreTranslate — avoids CORS issues
      const res = await fetch(
        `http://localhost:8081/api/reviews/${r.id}/translate?targetLang=${target}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.translations[r.id!] = data.translatedText || 'Translation unavailable';
    } catch {
      this.translations[r.id!] = 'Translation service unavailable. Try again later.';
    } finally {
      this.translating[r.id!] = false;
    }
  }

  starsArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  emptyStarsArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }
}