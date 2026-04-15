import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { Review, ReviewEditHistory } from '../../models/review.model';
import { ForumMessagingDialogComponent } from '../forum/forum.messaging-dialog.component';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, ForumMessagingDialogComponent],
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
            <input [(ngModel)]="form.author" placeholder="e.g. Alice Martin"
              [class.input-error]="touched['author'] && !form.author"
              (ngModelChange)="touch('author')" />
            <span class="error-msg" *ngIf="touched['author'] && !form.author">⚠ Please enter your name.</span>
          </div>

          <div class="form-group">
            <label>Rating</label>
            <div class="star-picker">
              <span *ngFor="let n of [1,2,3,4,5]" class="star-btn"
                [class.active]="n <= form.rating"
                (click)="form.rating = n; touch('rating')">★</span>
            </div>
            <span class="error-msg" *ngIf="touched['rating'] && !form.rating">⚠ Please select a rating.</span>
          </div>

          <div class="form-group">
            <label>Why are you leaving this review?</label>
            <select [(ngModel)]="form.reviewReason"
              [class.input-error]="touched['reviewReason'] && !form.reviewReason"
              (ngModelChange)="touch('reviewReason')">
              <option value="">— Select a reason —</option>
              <option value="Quality of work delivered">Quality of work delivered</option>
              <option value="Respect of deadlines">Respect of deadlines</option>
              <option value="Communication & responsiveness">Communication &amp; responsiveness</option>
              <option value="Value for money">Value for money</option>
              <option value="Overall experience with the platform">Overall experience with the platform</option>
              <option value="Professionalism & attitude">Professionalism &amp; attitude</option>
              <option value="Technical skills & expertise">Technical skills &amp; expertise</option>
              <option value="Accuracy to project requirements">Accuracy to project requirements</option>
            </select>
            <span class="error-msg" *ngIf="touched['reviewReason'] && !form.reviewReason">⚠ Please select a reason for your review.</span>
          </div>

          <div class="form-group">
            <label>Your Review</label>
            <textarea [(ngModel)]="form.content" rows="4" placeholder="Share your experience..."
              [class.input-error]="touched['content'] && !form.content"
              (ngModelChange)="touch('content')"></textarea>
            <span class="error-msg" *ngIf="touched['content'] && !form.content">⚠ Please write your review before submitting.</span>
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

          <div class="form-group">
            <label>How do you feel about this? <span class="label-hint">(optional — auto-detected if left blank)</span></label>
            <div class="sentiment-picker">
              <button type="button" class="sentiment-option"
                [class.selected]="form.sentiment === 'positive'"
                [class.opt-positive]="form.sentiment === 'positive'"
                (click)="setSentiment('positive')">
                😊 Positive
              </button>
              <button type="button" class="sentiment-option"
                [class.selected]="form.sentiment === 'neutral'"
                [class.opt-neutral]="form.sentiment === 'neutral'"
                (click)="setSentiment('neutral')">
                😐 Neutral
              </button>
              <button type="button" class="sentiment-option"
                [class.selected]="form.sentiment === 'negative'"
                [class.opt-negative]="form.sentiment === 'negative'"
                (click)="setSentiment('negative')">
                😞 Negative
              </button>
              <button type="button" class="sentiment-option opt-clear" *ngIf="form.sentiment"
                (click)="setSentiment('')">
                ✕ Clear (auto-detect)
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-submit" (click)="submitReview()" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : (editingId ? 'Update Review' : 'Submit Review') }}
            </button>
            <button class="btn-cancel" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
          </div>
          <p class="success-msg" *ngIf="successMsg">{{ successMsg }}</p>
        </section>

        <!-- NEW: AI Summary Panel -->
        <section class="ai-summary-card">
          <div class="ai-summary-header">
            <div class="ai-summary-title">
              <span class="ai-icon">🤖</span>
              <h3>AI Reviews Summary</h3>
            </div>
            <button class="btn-ai-summarize" (click)="summarizeReviews()" [disabled]="aiLoading || reviews.length === 0">
              <span *ngIf="!aiLoading">✨ {{ aiSummary ? 'Refresh Summary' : 'Summarize Reviews' }}</span>
              <span *ngIf="aiLoading" class="ai-loading-text">
                <span class="dot-anim">Analyzing</span>
              </span>
            </button>
          </div>

          <div class="ai-summary-body" *ngIf="aiSummary || aiLoading">
            <div class="ai-typing" *ngIf="aiLoading">
              <span></span><span></span><span></span>
            </div>
            <p class="ai-summary-text" *ngIf="aiSummary && !aiLoading">{{ aiSummary }}</p>
          </div>

          <div class="ai-ask-row" *ngIf="aiSummary && !aiLoading">
            <input
              class="ai-ask-input"
              [(ngModel)]="aiQuestion"
              placeholder="Ask a question about the reviews..."
              (keydown.enter)="askAboutReviews()" />
            <button class="btn-ai-ask" (click)="askAboutReviews()" [disabled]="aiLoading || !aiQuestion.trim()">Ask</button>
          </div>
          <p class="ai-answer" *ngIf="aiAnswer && !aiLoading">{{ aiAnswer }}</p>

          <p class="ai-empty-hint" *ngIf="reviews.length === 0">Add some reviews first to enable the AI summary.</p>
        </section>

        <!-- Reviews list -->
        <section class="reviews-list">
          <div class="list-header">
            <h2>Reviews <span class="count">({{ filteredReviews.length }})</span></h2>

            <div class="search-filter-bar">
              <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input
                  class="search-input"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearch()"
                  placeholder="Search by content, author, or reason..." />
                <button class="search-clear" *ngIf="searchQuery" (click)="clearSearch()">✕</button>
              </div>
              <div class="filter-tabs">
                <button class="filter-tab" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">All</button>
                <button class="filter-tab" [class.active]="activeFilter === 'bookmarked'" (click)="setFilter('bookmarked')">🔖 Bookmarked</button>
              </div>
            </div>

            <div class="no-results" *ngIf="filteredReviews.length === 0 && !loading">
              {{ activeFilter === 'bookmarked' ? 'No bookmarked reviews yet. Click 🔖 on a review to save it!' : 'No reviews match your search.' }}
            </div>
          </div>

          <div class="loading" *ngIf="loading">Loading reviews...</div>
          <div class="empty" *ngIf="!loading && reviews.length === 0">No reviews yet. Be the first!</div>

          <div class="review-card" *ngFor="let r of filteredReviews" [class.bookmarked-card]="r.bookmarked">
            <div class="review-top">
              <div class="avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
              <div class="review-meta">
                <strong>{{ r.author }}</strong>
                <div class="stars">
                  <span *ngFor="let s of starsArray(r.rating)" class="star filled">★</span>
                  <span *ngFor="let s of emptyStarsArray(r.rating)" class="star empty">★</span>
                </div>
                <span class="date">{{ r.createdAt | date:'mediumDate' }}</span>
                <!-- NEW: Edited badge -->
                <span class="edited-badge" *ngIf="r.edited">✏️ edited</span>
              </div>
              <div class="review-actions">
                <button class="btn-icon" [class.bookmarked]="r.bookmarked"
                  (click)="toggleBookmark(r)" [title]="r.bookmarked ? 'Remove bookmark' : 'Bookmark this review'">
                  🔖
                </button>
                <!-- NEW: History button — shown only when edited -->
                <button class="btn-icon" *ngIf="r.edited" (click)="openHistory(r)" title="View edit history">
                  📜
                </button>
                <button class="btn-icon" (click)="startEdit(r)" title="Edit">✏️</button>
              </div>
            </div>

            <!-- Reason badge -->
            <div class="reason-badge" *ngIf="r.reviewReason">
              <span class="reason-icon">💬</span> {{ r.reviewReason }}
            </div>

            <!-- Sentiment badge -->
            <div class="sentiment-badge" [class]="'sentiment-' + (r.sentiment || 'neutral')" *ngIf="r.sentiment">
              {{ sentimentIcon(r.sentiment) }} {{ r.sentiment }}
            </div>

            <p class="review-content">{{ r.content }}</p>

            <!-- Helpful votes -->
            <div class="helpful-row">
              <button class="btn-helpful" (click)="addHelpfulVote(r)">
                👍 Helpful <span class="helpful-count">({{ r.helpfulVotes || 0 }})</span>
              </button>
              <span class="helpful-label" *ngIf="(r.helpfulVotes || 0) > 0">
                {{ r.helpfulVotes }} {{ (r.helpfulVotes || 0) === 1 ? 'person' : 'people' }} found this helpful
              </span>
            </div>

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

      <app-messaging-dialog></app-messaging-dialog>

    </div>

    <!-- ── NEW: Edit History Modal ──────────────────────────────────── -->
    <div class="modal-overlay" *ngIf="historyModalOpen" (click)="closeHistory()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📜 Edit History</h3>
          <button class="modal-close" (click)="closeHistory()">✕</button>
        </div>

        <div class="modal-body">
          <div class="history-loading" *ngIf="historyLoading">Loading history...</div>
          <div class="history-empty" *ngIf="!historyLoading && history.length === 0">No edit history found.</div>

          <div class="history-entry" *ngFor="let h of history; let i = index">
            <div class="history-meta">
              <span class="history-num">Edit #{{ history.length - i }}</span>
              <span class="history-by">by <strong>{{ h.editedBy }}</strong></span>
              <span class="history-date">{{ h.editedAt | date:'medium' }}</span>
            </div>

            <div class="history-diff" *ngIf="h.oldRating !== h.newRating">
              <div class="diff-label">Rating changed:</div>
              <div class="diff-old">— {{ h.oldRating }} ★</div>
              <div class="diff-new">+ {{ h.newRating }} ★</div>
            </div>

            <div class="history-diff">
              <div class="diff-label">Content:</div>
              <div class="diff-old">— {{ h.oldContent }}</div>
              <div class="diff-new">+ {{ h.newContent }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reviews-page { font-family: 'DM Sans', sans-serif; background: #f8f9fb; min-height: 100vh; }

    .reviews-hero {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      padding: 5rem 2rem; text-align: center; color: white;
    }
    .hero-inner h1 { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }
    .hero-inner p { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }

    .avg-badge {
      display: inline-flex; flex-direction: column; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.1); padding: 1rem 2rem; border-radius: 16px; backdrop-filter: blur(10px);
    }
    .stars-display { display: flex; gap: 4px; font-size: 1.8rem; }
    .avg-number { font-size: 1.1rem; font-weight: 600; }

    .reviews-body {
      max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem;
      display: flex; flex-direction: column; gap: 2.5rem;
    }

    .write-review-card {
      background: white; border-radius: 20px; padding: 2.5rem; box-shadow: 0 4px 24px rgba(10,14,39,0.08);
      h2 { font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #0a0e27; margin-bottom: 1.5rem; }
    }

    .form-group {
      margin-bottom: 1.25rem;
      label { display: block; font-weight: 600; color: #374151; margin-bottom: 0.4rem; font-size: 0.9rem; }
      input, textarea, select {
        width: 100%; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 10px;
        font-size: 1rem; font-family: inherit; transition: border-color 0.2s; background: white;
        &:focus { outline: none; border-color: #00d9ff; }
      }
      textarea { resize: vertical; }
    }

    .input-error { border-color: #ef4444 !important; }
    .error-msg { display: block; color: #ef4444; font-size: 0.82rem; font-weight: 600; margin-top: 0.3rem; }

    .star-picker {
      display: flex; gap: 6px;
      .star-btn { font-size: 2rem; cursor: pointer; color: #d1d5db; transition: color 0.15s, transform 0.15s; &.active { color: #f59e0b; } &:hover { transform: scale(1.2); } }
    }

    .label-hint { font-size: 0.78rem; font-weight: 400; color: #9ca3af; margin-left: 0.3rem; }

    .sentiment-picker { display: flex; gap: 0.6rem; flex-wrap: wrap; }

    .sentiment-option {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1.1rem; border: 2px solid #e5e7eb; border-radius: 20px; background: white;
      font-size: 0.9rem; font-weight: 600; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.15s;
      &:hover { border-color: #9ca3af; color: #374151; }
      &.selected { font-weight: 700; }
      &.opt-positive { border-color: #10b981; background: #d1fae5; color: #065f46; }
      &.opt-neutral  { border-color: #9ca3af; background: #f3f4f6; color: #374151; }
      &.opt-negative { border-color: #ef4444; background: #fee2e2; color: #991b1b; }
      &.opt-clear    { border-color: #e5e7eb; color: #9ca3af; font-weight: 400; font-size: 0.82rem; &:hover { border-color: #ef4444; color: #dc2626; background: #fee2e2; } }
    }

    .form-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }

    .btn-submit {
      padding: 0.75rem 2rem; background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
      &:disabled { opacity: 0.6; cursor: not-allowed; } &:hover:not(:disabled) { opacity: 0.9; }
    }

    .btn-cancel {
      padding: 0.75rem 2rem; background: #f3f4f6; color: #374151; border: none;
      border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer;
      &:hover { background: #e5e7eb; }
    }

    .success-msg { margin-top: 1rem; color: #10b981; font-weight: 600; }

    /* ── NEW: AI Summary Card ── */
    .ai-summary-card {
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f45 100%);
      border-radius: 20px; padding: 1.75rem 2rem;
      box-shadow: 0 4px 24px rgba(10,14,39,0.18);
      display: flex; flex-direction: column; gap: 1rem;
      color: white;
    }

    .ai-summary-header {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }

    .ai-summary-title {
      display: flex; align-items: center; gap: 0.6rem;
      .ai-icon { font-size: 1.5rem; }
      h3 { font-family: 'Syne', sans-serif; font-size: 1.15rem; margin: 0; }
    }

    .btn-ai-summarize {
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white; border: none; border-radius: 10px;
      padding: 0.55rem 1.25rem; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.18s;
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,217,255,0.35); }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }

    .ai-loading-text { display: flex; align-items: center; gap: 4px; }

    .ai-summary-body {
      background: rgba(255,255,255,0.07); border-radius: 12px;
      padding: 1rem 1.25rem; min-height: 60px;
    }

    .ai-typing {
      display: flex; gap: 5px; align-items: center; padding: 0.25rem 0;
      span {
        width: 8px; height: 8px; background: #00d9ff; border-radius: 50%;
        animation: bounce 1.2s infinite;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } }

    .ai-summary-text {
      font-size: 0.95rem; line-height: 1.7; color: #e2e8f0;
      white-space: pre-wrap; word-break: break-word;
    }

    .ai-ask-row {
      display: flex; gap: 0.75rem;
      input { flex: 1; }
    }

    .ai-ask-input {
      flex: 1; padding: 0.6rem 1rem;
      background: rgba(255,255,255,0.1);
      border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px;
      color: white; font-family: inherit; font-size: 0.9rem;
      &::placeholder { color: rgba(255,255,255,0.45); }
      &:focus { outline: none; border-color: #00d9ff; background: rgba(255,255,255,0.15); }
    }

    .btn-ai-ask {
      background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.3);
      color: white; border-radius: 10px; padding: 0.6rem 1.25rem;
      font-weight: 600; cursor: pointer; font-family: inherit; font-size: 0.9rem;
      transition: background 0.18s;
      &:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }

    .ai-answer {
      font-size: 0.93rem; line-height: 1.65; color: #e2e8f0;
      background: rgba(255,255,255,0.07); border-radius: 10px;
      padding: 0.85rem 1.1rem; white-space: pre-wrap;
    }

    .ai-empty-hint { font-size: 0.85rem; color: rgba(255,255,255,0.45); text-align: center; padding: 0.5rem 0; }

    /* ── List & Cards ── */
    .list-header {
      margin-bottom: 1.5rem;
      h2 { font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #0a0e27; margin-bottom: 1rem; .count { color: #6b7280; font-size: 1.2rem; } }
    }

    .search-filter-bar { display: flex; flex-direction: column; gap: 0.75rem; }
    .search-input-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 1rem; font-size: 1rem; pointer-events: none; }
    .search-input {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 2px solid #e5e7eb;
      border-radius: 12px; font-size: 0.95rem; font-family: inherit; background: white; transition: border-color 0.2s;
      &:focus { outline: none; border-color: #00d9ff; }
    }
    .search-clear {
      position: absolute; right: 0.75rem; background: none; border: none; color: #9ca3af;
      font-size: 1rem; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px;
      &:hover { color: #374151; background: #f3f4f6; }
    }
    .filter-tabs { display: flex; gap: 0.5rem; }
    .filter-tab {
      padding: 0.4rem 1rem; border: 2px solid #e5e7eb; border-radius: 20px; background: white;
      font-size: 0.85rem; font-weight: 600; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.2s;
      &.active { border-color: #0a0e27; background: #0a0e27; color: white; }
      &:hover:not(.active) { border-color: #9ca3af; color: #374151; }
    }
    .no-results { color: #9ca3af; font-size: 0.95rem; padding: 1rem 0; text-align: center; }
    .loading, .empty { text-align: center; color: #6b7280; padding: 3rem; font-size: 1.1rem; }
    .bookmarked-card { border-left: 4px solid #f59e0b !important; }

    .review-card {
      background: white; border-radius: 16px; padding: 2rem;
      box-shadow: 0 2px 12px rgba(10,14,39,0.06); margin-bottom: 1.25rem;
      transition: box-shadow 0.2s; border-left: 4px solid transparent;
      &:hover { box-shadow: 0 6px 24px rgba(10,14,39,0.1); }
    }

    .review-top { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }

    .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #00d9ff, #ff006e);
      color: white; font-weight: 700; font-size: 1.2rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .review-meta {
      flex: 1;
      strong { display: block; color: #0a0e27; font-size: 1rem; margin-bottom: 4px; }
      .date { font-size: 0.85rem; color: #9ca3af; margin-top: 4px; display: block; }
    }

    /* NEW: Edited badge */
    .edited-badge { font-size: 0.75rem; color: #9ca3af; font-style: italic; margin-left: 0.5rem; }

    .stars { display: flex; gap: 3px; }
    .star { font-size: 1.1rem; }
    .star.filled { color: #f59e0b; }
    .star.empty { color: #d1d5db; }

    .review-actions { margin-left: auto; display: flex; gap: 0.25rem; }

    .btn-icon {
      background: none; border: none; cursor: pointer; font-size: 1.1rem;
      padding: 4px 8px; border-radius: 8px;
      &:hover { background: #f3f4f6; }
      &.bookmarked { filter: sepia(1) saturate(5) hue-rotate(5deg); }
    }

    .reason-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #eff6ff; color: #1d4ed8; font-size: 0.82rem; font-weight: 600;
      padding: 4px 12px; border-radius: 20px; margin-bottom: 0.5rem; margin-right: 0.5rem;
    }

    .sentiment-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.8rem; font-weight: 700; padding: 4px 12px;
      border-radius: 20px; margin-bottom: 0.75rem; text-transform: capitalize;
    }
    .sentiment-positive { background: #d1fae5; color: #065f46; }
    .sentiment-neutral  { background: #f3f4f6; color: #4b5563; }
    .sentiment-negative { background: #fee2e2; color: #991b1b; }

    .review-content { color: #374151; line-height: 1.7; margin-bottom: 1rem; }

    .helpful-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .btn-helpful {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #f3f4f6; border: none; border-radius: 20px;
      padding: 0.35rem 1rem; font-size: 0.85rem; font-weight: 600;
      color: #374151; cursor: pointer; font-family: inherit; transition: all 0.15s;
      &:hover { background: #dbeafe; color: #1d4ed8; transform: scale(1.03); }
    }
    .helpful-label { font-size: 0.82rem; color: #6b7280; }

    .translate-section {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      padding-top: 1rem; border-top: 1px solid #f3f4f6;
      select { padding: 0.4rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem; background: white; }
    }
    .btn-translate {
      padding: 0.4rem 1rem; background: #f3f4f6; border: none; border-radius: 8px;
      font-size: 0.9rem; cursor: pointer; font-weight: 600;
      &:disabled { opacity: 0.6; cursor: not-allowed; } &:hover:not(:disabled) { background: #e5e7eb; }
    }
    .translated-text { width: 100%; margin-top: 0.5rem; color: #6b7280; font-size: 0.95rem; background: #f8f9fb; padding: 0.75rem 1rem; border-radius: 8px; }

    /* ── History Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem; backdrop-filter: blur(3px);
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-box {
      background: white; border-radius: 20px; width: 100%; max-width: 640px;
      max-height: 80vh; display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.25s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb;
      h3 { font-family: 'Syne', sans-serif; font-size: 1.2rem; color: #0a0e27; margin: 0; }
    }
    .modal-close {
      background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #6b7280;
      padding: 0.25rem 0.5rem; border-radius: 6px;
      &:hover { background: #f3f4f6; color: #374151; }
    }

    .modal-body { overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .history-loading, .history-empty { color: #9ca3af; text-align: center; padding: 2rem; }

    .history-entry {
      border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }

    .history-meta {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      font-size: 0.85rem; color: #6b7280;
    }
    .history-num { font-weight: 700; color: #0a0e27; background: #f3f4f6; padding: 2px 8px; border-radius: 6px; }
    .history-by strong { color: #374151; }
    .history-date { margin-left: auto; color: #9ca3af; font-size: 0.8rem; }

    .history-diff { display: flex; flex-direction: column; gap: 0.35rem; }
    .diff-label { font-size: 0.78rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    .diff-old {
      background: #fff1f1; border-left: 3px solid #ef4444; color: #7f1d1d;
      font-size: 0.9rem; padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0;
      white-space: pre-wrap; word-break: break-word;
    }
    .diff-new {
      background: #f0fdf4; border-left: 3px solid #22c55e; color: #14532d;
      font-size: 0.9rem; padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0;
      white-space: pre-wrap; word-break: break-word;
    }
  `]
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  averageRating = 0;
  loading = true;
  submitting = false;
  successMsg = '';
  editingId: number | null = null;
  translateTarget: { [id: number]: string } = {};
  translations: { [id: number]: string } = {};
  translating: { [id: number]: boolean } = {};

  searchQuery = '';
  activeFilter: 'all' | 'bookmarked' = 'all';

  touched: { [key: string]: boolean } = {};

  form: Review = { author: '', content: '', rating: 5, language: 'en', reviewReason: '' };

  // NEW: history modal state
  historyModalOpen = false;
  historyLoading = false;
  history: ReviewEditHistory[] = [];

  // NEW: AI summary state
  aiLoading = false;
  aiSummary = '';
  aiQuestion = '';
  aiAnswer = '';

  constructor(private reviewService: ReviewService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.reviewService.getAll().subscribe({
      next: (data) => { this.reviews = data; this.loading = false; this.applyFilter(); },
      error: () => { this.loading = false; }
    });
    this.reviewService.getAverageRating().subscribe({
      next: (data) => { this.averageRating = data.averageRating; }
    });
  }

  // ── Search & filter ───────────────────────────────────────────────

  onSearch() {
    if (this.searchQuery.trim()) {
      this.reviewService.search(this.searchQuery.trim()).subscribe(results => {
        this.reviews = results; this.applyFilter();
      });
    } else { this.load(); }
  }

  clearSearch() { this.searchQuery = ''; this.load(); }

  setFilter(filter: 'all' | 'bookmarked') { this.activeFilter = filter; this.applyFilter(); }

  private applyFilter() {
    if (this.activeFilter === 'bookmarked') {
      this.filteredReviews = this.reviews.filter(r => r.bookmarked);
    } else {
      this.filteredReviews = [...this.reviews];
    }
  }

  // ── NEW: Edit history modal ───────────────────────────────────────

  openHistory(r: Review) {
    this.historyModalOpen = true;
    this.historyLoading = true;
    this.history = [];
    this.reviewService.getReviewHistory(r.id!).subscribe({
      next: (data) => { this.history = data; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
  }

  closeHistory() { this.historyModalOpen = false; this.history = []; }

  // ── NEW: AI Reviews Summary ───────────────────────────────────────

  async summarizeReviews() {
    if (this.reviews.length === 0 || this.aiLoading) return;
    this.aiLoading = true;
    this.aiSummary = '';
    this.aiAnswer = '';
    this.aiQuestion = '';

    const reviewsText = this.reviews.map((r, i) =>
      `Review ${i + 1} — ${r.author} (${r.rating}/5, ${r.reviewReason || 'no reason'}): "${r.content}"`
    ).join('\n');

    try {
      const response = await fetch('http://localhost:8081/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewsText,
          reviewCount: this.reviews.length
        })
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      this.aiSummary = data.summary ?? 'Could not generate summary.';
    } catch {
      this.aiSummary = 'AI summary unavailable. Please check your connection and try again.';
    } finally {
      this.aiLoading = false;
    }
  }

  async askAboutReviews() {
    const q = this.aiQuestion.trim();
    if (!q || this.aiLoading || this.reviews.length === 0) return;
    this.aiLoading = true;
    this.aiAnswer = '';

    const reviewsText = this.reviews.map((r, i) =>
      `Review ${i + 1} — ${r.author} (${r.rating}/5, ${r.reviewReason || 'no reason'}): "${r.content}"`
    ).join('\n');

    try {
      const response = await fetch('http://localhost:8081/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, reviewsText })
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      this.aiAnswer = data.answer ?? 'Could not generate an answer.';
    } catch {
      this.aiAnswer = 'AI answer unavailable. Please check your connection and try again.';
    } finally {
      this.aiLoading = false;
      this.aiQuestion = '';
    }
  }

  // ── Bookmark & helpful vote ───────────────────────────────────────

  toggleBookmark(r: Review) {
    this.reviewService.toggleBookmark(r.id!).subscribe(updated => {
      const idx = this.reviews.findIndex(x => x.id === r.id);
      if (idx !== -1) this.reviews[idx] = updated;
      this.applyFilter();
    });
  }

  addHelpfulVote(r: Review) {
    this.reviewService.addHelpfulVote(r.id!).subscribe(updated => {
      const idx = this.reviews.findIndex(x => x.id === r.id);
      if (idx !== -1) { this.reviews[idx] = updated; this.applyFilter(); }
    });
  }

  // ── Sentiment helpers ─────────────────────────────────────────────

  setSentiment(value: string) { this.form.sentiment = value || undefined; }

  sentimentIcon(sentiment?: string): string {
    if (sentiment === 'positive') return '😊';
    if (sentiment === 'negative') return '😞';
    return '😐';
  }

  // ── Form helpers ──────────────────────────────────────────────────

  touch(field: string) { this.touched[field] = true; }
  touchAll() { ['author', 'rating', 'reviewReason', 'content'].forEach(f => this.touched[f] = true); }
  isFormValid(): boolean { return !!(this.form.author && this.form.content && this.form.rating && this.form.reviewReason); }

  submitReview() {
    this.touchAll();
    if (!this.isFormValid()) return;
    this.submitting = true;
    const action = this.editingId
      ? this.reviewService.update(this.editingId, this.form)
      : this.reviewService.create(this.form);
    action.subscribe({
      next: () => {
        this.submitting = false;
        this.successMsg = this.editingId ? 'Review updated!' : 'Review submitted!';
        this.resetForm(); this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.submitting = false; }
    });
  }

  startEdit(r: Review) {
    this.editingId = r.id!; this.form = { ...r }; this.touched = {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() { this.editingId = null; this.resetForm(); }

  resetForm() {
    this.editingId = null; this.touched = {};
    this.form = { author: '', content: '', rating: 5, language: 'en', reviewReason: '' };
  }

  async translate(r: Review) {
    const target = this.translateTarget[r.id!];
    if (!target || !r.content) return;
    this.translating[r.id!] = true;
    this.translations[r.id!] = '';
    try {
      const res = await fetch(`http://localhost:8081/api/reviews/${r.id}/translate?targetLang=${target}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.translations[r.id!] = data.translatedText || 'Translation unavailable';
    } catch {
      this.translations[r.id!] = 'Translation service unavailable. Try again later.';
    } finally {
      this.translating[r.id!] = false;
    }
  }

  starsArray(rating: number): number[] { return Array(Math.floor(rating)).fill(0); }
  emptyStarsArray(rating: number): number[] { return Array(5 - Math.floor(rating)).fill(0); }
}