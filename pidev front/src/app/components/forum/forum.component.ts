import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../services/forum.service';
import { ForumPost, Reply, PostEditHistory } from '../../models/forum.model';
import { ForumChatbotComponent } from './forum.chatbot.component';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, ForumChatbotComponent],
  template: `
    <div class="forum-page">

      <!-- Hero -->
      <section class="forum-hero">
        <div class="hero-inner">
          <h1>Community Forum</h1>
          <p>Ask questions, share ideas, connect with freelancers</p>
        </div>
      </section>

      <div class="forum-body">

        <!-- Create post form -->
        <section class="create-post-card">
          <h2>{{ editingId ? 'Edit Post' : 'Start a Discussion' }}</h2>

          <div class="form-group">
            <label>Your Name</label>
            <input [(ngModel)]="form.author" placeholder="e.g. John Doe"
              [class.input-error]="touched['author'] && !form.author"
              (ngModelChange)="touch('author')" />
            <span class="error-msg" *ngIf="touched['author'] && !form.author">⚠ Please enter your name.</span>
          </div>

          <div class="form-group">
            <label>Title</label>
            <input [(ngModel)]="form.title" placeholder="What's your question or topic?"
              [class.input-error]="touched['title'] && !form.title"
              (ngModelChange)="touch('title')" />
            <span class="error-msg" *ngIf="touched['title'] && !form.title">⚠ Please enter a title for your post.</span>
          </div>

          <div class="form-group">
            <label>Content</label>
            <textarea [(ngModel)]="form.content" rows="4" placeholder="Describe in detail..."
              [class.input-error]="touched['content'] && !form.content"
              (ngModelChange)="touch('content')"></textarea>
            <span class="error-msg" *ngIf="touched['content'] && !form.content">⚠ Please write your post content.</span>
          </div>

          <div class="form-group" *ngIf="!editingId">
            <label>Image (optional)</label>
            <input type="file" accept="image/*" (change)="onFileSelect($event)" />
            <div class="image-preview" *ngIf="previewUrl">
              <img [src]="previewUrl" alt="Preview" />
            </div>
          </div>

          <div class="form-group" *ngIf="!editingId">
            <label>🎵 Audio / Voicemail (optional — MP3, WAV, OGG)</label>
            <input type="file" accept="audio/*" (change)="onAudioSelect($event)" />
            <div class="audio-preview" *ngIf="audioPreviewUrl">
              <audio controls [src]="audioPreviewUrl"></audio>
              <button class="btn-remove-audio" (click)="removeAudio()">✕ Remove audio</button>
            </div>
          </div>

          <div class="form-group" *ngIf="!editingId">
            <label>🎬 Video URL (optional — YouTube or Vimeo link)</label>
            <input type="url" placeholder="https://www.youtube.com/watch?v=..."
              [(ngModel)]="form.videoUrl" class="video-url-input" />
            <div class="video-preview" *ngIf="form.videoUrl.trim()">
              <iframe [src]="getSafeEmbedUrl(form.videoUrl)" frameborder="0"
                allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-submit" (click)="submitPost()" [disabled]="submitting">
              {{ submitting ? 'Posting...' : (editingId ? 'Update Post' : 'Post Discussion') }}
            </button>
            <button class="btn-cancel" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
          </div>
          <p class="success-msg" *ngIf="successMsg">{{ successMsg }}</p>
        </section>

        <!-- Posts list -->
        <section class="posts-list">
          <div class="list-header">
            <h2>Discussions <span class="count">({{ filteredPosts.length }})</span></h2>

            <div class="search-filter-bar">
              <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input
                  class="search-input"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearch()"
                  placeholder="Search posts by title, content, or author..." />
                <button class="search-clear" *ngIf="searchQuery" (click)="clearSearch()">✕</button>
              </div>
              <div class="filter-tabs">
                <button class="filter-tab" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">All</button>
                <button class="filter-tab" [class.active]="activeFilter === 'bookmarked'" (click)="setFilter('bookmarked')">🔖 Bookmarked</button>
              </div>
            </div>

            <div class="no-results" *ngIf="filteredPosts.length === 0 && !loading">
              {{ activeFilter === 'bookmarked' ? 'No bookmarked posts yet. Click 🔖 on a post to save it!' : 'No posts match your search.' }}
            </div>
          </div>

          <div class="loading" *ngIf="loading">Loading posts...</div>

          <div class="post-card" *ngFor="let p of filteredPosts" [class.bookmarked-card]="p.bookmarked">
            <!-- Post header -->
            <div class="post-header">
              <div class="avatar">{{ p.author.charAt(0).toUpperCase() }}</div>
              <div class="post-meta">
                <strong>{{ p.author }}</strong>
                <span class="date">{{ p.createdAt | date:'medium' }}</span>
                <!-- NEW: Edited badge -->
                <span class="edited-badge" *ngIf="p.edited">✏️ edited</span>
              </div>
              <div class="post-actions">
                <!-- Bookmark toggle -->
                <button class="btn-icon" [class.bookmarked]="p.bookmarked"
                  (click)="toggleBookmark(p)" [title]="p.bookmarked ? 'Remove bookmark' : 'Bookmark this post'">
                  🔖
                </button>
                <!-- Edit history button — only shown on edited posts -->
                <button class="btn-icon" *ngIf="p.edited" (click)="openHistory(p)" title="View edit history">
                  📜
                </button>
                <button class="btn-icon" (click)="startEdit(p)" title="Edit">✏️</button>
                <button class="btn-icon danger" (click)="deletePost(p.id!)" title="Delete">🗑️</button>
              </div>
            </div>

            <!-- Bookmark badge -->
            <div class="bookmark-badge" *ngIf="p.bookmarked">🔖 Bookmarked</div>

            <h3 class="post-title">{{ p.title }}</h3>
            <p class="post-content">{{ p.content }}</p>

            <!-- Text-to-speech controls -->
            <div class="tts-bar">
              <button class="tts-btn" (click)="toggleSpeak(p)" [class.speaking]="speakingId === p.id">
                <span class="tts-icon">{{ speakingId === p.id ? '⏹' : '🔊' }}</span>
                <span>{{ speakingId === p.id ? 'Stop' : 'Read aloud' }}</span>
              </button>
              <div class="tts-speed" *ngIf="speakingId === p.id || lastSpokenId === p.id">
                <label>Speed:</label>
                <input type="range" min="0.5" max="2" step="0.1" [(ngModel)]="speechRate" (ngModelChange)="onRateChange(p)" />
                <span class="speed-label">{{ speechRate }}x</span>
              </div>
            </div>

            <!-- Post image -->
            <div class="post-image" *ngIf="p.imageUrl">
              <img [src]="'http://localhost:8082' + p.imageUrl" alt="Post image" />
            </div>

            <!-- Post audio -->
            <div class="post-audio" *ngIf="p.audioUrl">
              <div class="audio-label">
                <span class="audio-icon">🎵</span> Voice message / Audio
              </div>
              <audio controls [src]="'http://localhost:8082' + p.audioUrl"></audio>
            </div>

            <!-- Post video -->
            <div class="post-video" *ngIf="p.videoUrl && p.videoUrl.trim() !== ''">
              <iframe [src]="getSafeEmbedUrl(p.videoUrl)" frameborder="0"
                allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>

            <!-- Emoji reactions -->
            <div class="reactions-bar">
              <span class="reaction-label">React:</span>
              <button class="emoji-btn" *ngFor="let e of emojiList" (click)="react(p, e)">
                {{ e }} <span class="emoji-count">{{ getReactionCount(p, e) || '' }}</span>
              </button>
            </div>

            <!-- Replies -->
            <div class="replies-section">
              <button class="btn-replies-toggle" (click)="toggleReplies(p)">
                {{ openReplies[p.id!] ? '▲ Hide' : '▼ Show' }} replies
                ({{ (repliesMap[p.id!] ? repliesMap[p.id!].length : (p.replies ? p.replies.length : 0)) }})
              </button>

              <div class="replies-list" *ngIf="openReplies[p.id!]">
                <div class="reply-card" *ngFor="let r of repliesMap[p.id!]">
                  <div class="reply-avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
                  <div class="reply-body">
                    <strong>{{ r.author }}</strong>
                    <span class="date">{{ r.createdAt | date:'short' }}</span>
                    <p>{{ r.content }}</p>
                    <button class="btn-like-reply" (click)="likeReply(r, p.id!)">
                      👍 <span class="like-count">{{ r.likeCount || 0 }}</span>
                    </button>
                  </div>
                </div>

                <div class="add-reply-form">
                  <input [(ngModel)]="replyForms[p.id!].author" placeholder="Your name"
                    [class.input-error]="replyTouched[p.id!] && replyTouched[p.id!]['author'] && replyForms[p.id!] && !replyForms[p.id!]['author']"
                    (ngModelChange)="touchReply(p.id!, 'author')" />
                  <span class="error-msg" *ngIf="replyTouched[p.id!] && replyTouched[p.id!]['author'] && !replyForms[p.id!]?.author">⚠ Name required.</span>
                  <textarea [(ngModel)]="replyForms[p.id!].content" rows="2" placeholder="Write your reply..."
                    [class.input-error]="replyTouched[p.id!] && replyTouched[p.id!]['content'] && replyForms[p.id!] && !replyForms[p.id!]['content']"
                    (ngModelChange)="touchReply(p.id!, 'content')"></textarea>
                  <span class="error-msg" *ngIf="replyTouched[p.id!] && replyTouched[p.id!]['content'] && !replyForms[p.id!]?.content">⚠ Reply content required.</span>
                  <button class="btn-reply" (click)="submitReply(p.id!)">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ── NEW: Edit History Modal ────────────────────────────────── -->
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

              <div class="history-diff" *ngIf="h.oldTitle !== h.newTitle">
                <div class="diff-label">Title changed:</div>
                <div class="diff-old">— {{ h.oldTitle }}</div>
                <div class="diff-new">+ {{ h.newTitle }}</div>
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

      <!-- ── NEW: Browser notification permission banner ─────────────── -->
      <div class="notif-banner" *ngIf="showNotifBanner">
        <span>🔔 Enable notifications to get alerts when your posts receive replies</span>
        <button class="notif-allow-btn" (click)="requestNotifPermission()">Allow</button>
        <button class="notif-dismiss-btn" (click)="showNotifBanner = false">Not now</button>
      </div>

    </div>

    <!-- ── Inline AI Assistant (floating panel, bottom-right) ─────── -->
    <app-forum-chatbot></app-forum-chatbot>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .forum-page { font-family: 'DM Sans', sans-serif; background: #f8f9fb; min-height: 100vh; }

    .forum-hero {
      background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
      padding: 5rem 2rem;
      text-align: center;
      color: white;
    }
    .hero-inner h1 { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }
    .hero-inner p { font-size: 1.2rem; opacity: 0.8; }

    .forum-body {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .create-post-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 4px 24px rgba(10,14,39,0.08);
      h2 { font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #0a0e27; margin-bottom: 1.5rem; }
    }

    .form-group {
      margin-bottom: 1.25rem;
      label { display: block; font-weight: 600; color: #374151; margin-bottom: 0.4rem; font-size: 0.9rem; }
      input:not([type="file"]), textarea, select {
        width: 100%; padding: 0.75rem 1rem; border: 2px solid #e5e7eb;
        border-radius: 10px; font-size: 1rem; font-family: inherit;
        transition: border-color 0.2s; background: white;
        &:focus { outline: none; border-color: #00d9ff; }
      }
      input[type="file"] { font-size: 0.95rem; color: #374151; }
      textarea { resize: vertical; }
    }

    .input-error { border-color: #ef4444 !important; }
    .error-msg { display: block; color: #ef4444; font-size: 0.82rem; font-weight: 600; margin-top: 0.3rem; }

    .image-preview { margin-top: 0.75rem; img { max-width: 200px; max-height: 150px; border-radius: 10px; object-fit: cover; border: 2px solid #e5e7eb; } }
    .audio-preview { margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; audio { height: 40px; border-radius: 8px; } }
    .btn-remove-audio { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; &:hover { background: #fecaca; } }

    .form-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }

    .btn-submit {
      padding: 0.75rem 2rem; background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: opacity 0.2s; font-family: inherit;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: 0.9; }
    }

    .btn-cancel {
      padding: 0.75rem 2rem; background: #f3f4f6; color: #374151; border: none;
      border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; font-family: inherit;
      &:hover { background: #e5e7eb; }
    }

    .success-msg { margin-top: 1rem; color: #10b981; font-weight: 600; }

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

    .bookmarked-card { border-left: 4px solid #f59e0b !important; }

    .bookmark-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: #fef3c7; color: #92400e; font-size: 0.78rem; font-weight: 700;
      padding: 3px 10px; border-radius: 20px; margin-bottom: 0.75rem;
    }

    /* NEW: Edited badge */
    .edited-badge {
      font-size: 0.75rem; color: #9ca3af; font-style: italic; margin-left: 0.5rem;
    }

    .loading, .empty { text-align: center; color: #6b7280; padding: 3rem; font-size: 1.1rem; }

    .post-card {
      background: white; border-radius: 16px; padding: 2rem;
      box-shadow: 0 2px 12px rgba(10,14,39,0.06); margin-bottom: 1.25rem;
      transition: box-shadow 0.2s; border-left: 4px solid transparent;
      &:hover { box-shadow: 0 6px 24px rgba(10,14,39,0.1); }
    }

    .post-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }

    .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #ff006e, #00d9ff);
      color: white; font-weight: 700; font-size: 1.2rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .post-meta { flex: 1; strong { display: block; color: #0a0e27; margin-bottom: 4px; } .date { font-size: 0.85rem; color: #9ca3af; } }

    .post-actions { display: flex; gap: 0.5rem; align-items: center; }

    .btn-icon {
      background: none; border: none; cursor: pointer; font-size: 1.1rem;
      padding: 4px 8px; border-radius: 8px; transition: background 0.15s;
      &:hover { background: #f3f4f6; }
      &.danger:hover { background: #fee2e2; }
      &.bookmarked { color: #f59e0b; }
    }

    .post-title { font-family: 'Syne', sans-serif; font-size: 1.25rem; color: #0a0e27; margin-bottom: 0.75rem; }
    .post-content { color: #374151; line-height: 1.7; margin-bottom: 1rem; }

    .post-image { margin-bottom: 1rem; img { max-width: 100%; max-height: 350px; border-radius: 12px; object-fit: cover; } }

    .post-audio {
      margin-bottom: 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 0.75rem 1rem;
      .audio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #0369a1; margin-bottom: 0.5rem; .audio-icon { font-size: 1rem; } }
      audio { width: 100%; height: 40px; border-radius: 8px; }
    }

    .post-video {
      margin: 0.75rem 0; border-radius: 12px; overflow: hidden;
      position: relative; padding-bottom: 56.25%; height: 0; background: #000;
      iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    }

    .video-url-input {
      width: 100%; padding: 0.6rem 0.9rem; border: 1.5px solid #e5e7eb;
      border-radius: 8px; font-size: 0.9rem; font-family: inherit; transition: border-color 0.2s; box-sizing: border-box;
      &:focus { outline: none; border-color: #0099ff; }
    }

    .video-preview {
      margin-top: 0.75rem; border-radius: 12px; overflow: hidden;
      position: relative; padding-bottom: 56.25%; height: 0; background: #000;
      iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    }

    .tts-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; flex-wrap: wrap; }

    .tts-btn {
      display: flex; align-items: center; gap: 0.4rem; background: #f3f4f6;
      border: none; border-radius: 20px; padding: 0.35rem 1rem; font-size: 0.85rem;
      font-weight: 600; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.2s, color 0.2s;
      &:hover { background: #e5e7eb; }
      &.speaking { background: #eff6ff; color: #1d4ed8; animation: pulse-tts 1.5s ease-in-out infinite; }
      .tts-icon { font-size: 1rem; }
    }

    @keyframes pulse-tts { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    .tts-speed {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #6b7280;
      label { font-weight: 600; white-space: nowrap; }
      input[type="range"] { width: 90px; accent-color: #0099ff; cursor: pointer; padding: 0; border: none; background: none; height: auto; }
      .speed-label { font-weight: 700; color: #0099ff; min-width: 32px; }
    }

    .reactions-bar {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;
      margin-bottom: 1rem; flex-wrap: wrap;
    }

    .reaction-label { color: #9ca3af; font-size: 0.85rem; margin-right: 0.25rem; }

    .emoji-btn {
      background: #f3f4f6; border: none; border-radius: 20px; padding: 0.3rem 0.75rem;
      font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 4px;
      transition: background 0.15s, transform 0.15s;
      &:hover { background: #e5e7eb; transform: scale(1.1); }
      .emoji-count { font-size: 0.8rem; color: #6b7280; font-weight: 600; }
    }

    .btn-replies-toggle {
      background: none; border: none; color: #0099ff; font-weight: 600;
      cursor: pointer; font-size: 0.9rem; padding: 0; font-family: inherit;
      &:hover { text-decoration: underline; }
    }

    .replies-list { margin-top: 1rem; }

    .reply-card { display: flex; gap: 0.75rem; padding: 0.75rem 0; border-top: 1px solid #f3f4f6; }

    .reply-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-weight: 700; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .reply-body {
      flex: 1;
      strong { display: inline; color: #0a0e27; margin-right: 0.5rem; }
      .date { font-size: 0.8rem; color: #9ca3af; }
      p { margin-top: 0.25rem; color: #374151; font-size: 0.95rem; line-height: 1.6; }
    }

    .btn-like-reply {
      display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.5rem;
      background: #f3f4f6; border: none; border-radius: 20px; padding: 0.25rem 0.75rem;
      font-size: 0.85rem; font-weight: 600; cursor: pointer; color: #374151;
      transition: background 0.15s, transform 0.15s; font-family: inherit;
      &:hover { background: #dbeafe; color: #1d4ed8; transform: scale(1.05); }
      .like-count { font-size: 0.85rem; }
    }

    .add-reply-form {
      margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;
      padding-top: 1rem; border-top: 1px dashed #e5e7eb;
      input, textarea {
        width: 100%; padding: 0.6rem 0.9rem; border: 2px solid #e5e7eb;
        border-radius: 8px; font-size: 0.95rem; font-family: inherit;
        &:focus { outline: none; border-color: #00d9ff; }
      }
      textarea { resize: none; }
    }

    .btn-reply {
      align-self: flex-end; padding: 0.5rem 1.5rem;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white; border: none; border-radius: 8px;
      font-weight: 600; cursor: pointer; font-family: inherit;
      &:hover { opacity: 0.9; }
    }

    /* ── NEW: History Modal ── */
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

    /* ── NEW: Notification banner ── */
    .notif-banner {
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      background: #0a0e27; color: white; padding: 0.9rem 1.5rem;
      border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      display: flex; align-items: center; gap: 1rem; z-index: 999;
      font-size: 0.9rem; max-width: 90vw; animation: slideUp 0.3s ease-out;
    }

    .notif-allow-btn {
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white; border: none; border-radius: 8px;
      padding: 0.4rem 1rem; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      &:hover { opacity: 0.9; }
    }

    .notif-dismiss-btn {
      background: rgba(255,255,255,0.15); color: white; border: none; border-radius: 8px;
      padding: 0.4rem 0.75rem; cursor: pointer; font-family: inherit; white-space: nowrap; font-size: 0.85rem;
      &:hover { background: rgba(255,255,255,0.25); }
    }
  `]
})
export class ForumComponent implements OnInit {
  posts: ForumPost[] = [];
  filteredPosts: ForumPost[] = [];
  loading = true;
  submitting = false;
  successMsg = '';
  editingId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  selectedAudio: File | null = null;
  audioPreviewUrl: string | null = null;

  searchQuery = '';
  activeFilter: 'all' | 'bookmarked' = 'all';

  openReplies: { [id: number]: boolean } = {};
  repliesMap: { [id: number]: Reply[] } = {};
  replyForms: { [id: number]: { author: string; content: string } } = {};

  touched: { [key: string]: boolean } = {};
  replyTouched: { [postId: number]: { author?: boolean; content?: boolean } } = {};

  emojiList = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

  speakingId: number | null = null;
  lastSpokenId: number | null = null;
  speechRate: number = 1;

  form = { author: '', title: '', content: '', videoUrl: '' };

  // NEW: history modal state
  historyModalOpen = false;
  historyLoading = false;
  history: PostEditHistory[] = [];

  // NEW: browser notification banner
  showNotifBanner = false;

  constructor(
    private forumService: ForumService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.load();
    this.checkNotifPermission();
  }

  // ── NEW: Browser Notification helpers ────────────────────────────

  checkNotifPermission() {
    if (!('Notification' in window)) return;
    // Show banner only if permission hasn't been decided yet
    if (Notification.permission === 'default') {
      setTimeout(() => this.showNotifBanner = true, 1500);
    }
  }

  requestNotifPermission() {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(perm => {
      this.showNotifBanner = false;
      if (perm === 'granted') {
        new Notification('🔔 Notifications enabled!', {
          body: "You'll now be notified when your posts get replies.",
          icon: '/favicon.ico'
        });
      }
    });
  }

  // Fires a browser notification when a reply is successfully posted
  private fireReplyNotification(postTitle: string, replyAuthor: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification('💬 New reply on your post', {
      body: `${replyAuthor} replied to "${postTitle}"`,
      icon: '/favicon.ico',
      tag: 'forum-reply'
    });
  }

  // ── NEW: Edit history modal ───────────────────────────────────────

  openHistory(p: ForumPost) {
    this.historyModalOpen = true;
    this.historyLoading = true;
    this.history = [];
    this.forumService.getPostHistory(p.id!).subscribe({
      next: (data) => { this.history = data; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
  }

  closeHistory() {
    this.historyModalOpen = false;
    this.history = [];
  }

  // ── Load & filter ─────────────────────────────────────────────────

  load() {
    this.loading = true;
    this.forumService.getAll().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
        this.applyFilter();
        data.forEach(p => {
          if (!this.replyForms[p.id!]) {
            this.replyForms[p.id!] = { author: '', content: '' };
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      this.forumService.search(this.searchQuery.trim()).subscribe(results => {
        this.posts = results;
        this.applyFilter();
      });
    } else {
      this.load();
    }
  }

  clearSearch() { this.searchQuery = ''; this.load(); }

  setFilter(filter: 'all' | 'bookmarked') {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.activeFilter === 'bookmarked') {
      this.filteredPosts = this.posts.filter(p => p.bookmarked);
    } else {
      this.filteredPosts = [...this.posts];
    }
  }

  // ── Bookmark ──────────────────────────────────────────────────────

  toggleBookmark(p: ForumPost) {
    this.forumService.toggleBookmark(p.id!).subscribe(updated => {
      const idx = this.posts.findIndex(x => x.id === p.id);
      if (idx !== -1) this.posts[idx] = updated;
      this.applyFilter();
    });
  }

  // ── Reply like ────────────────────────────────────────────────────

  likeReply(reply: Reply, postId: number) {
    this.forumService.likeReply(reply.id!).subscribe(updated => {
      const replies = this.repliesMap[postId];
      if (replies) {
        const idx = replies.findIndex(r => r.id === reply.id);
        if (idx !== -1) replies[idx] = updated;
      }
    });
  }

  // ── Form helpers ──────────────────────────────────────────────────

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewUrl = e.target.result;
    reader.readAsDataURL(file);
  }

  onAudioSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedAudio = file;
    this.audioPreviewUrl = URL.createObjectURL(file);
  }

  removeAudio() { this.selectedAudio = null; this.audioPreviewUrl = null; }

  touch(field: string) { this.touched[field] = true; }
  touchAll() { ['author', 'title', 'content'].forEach(f => this.touched[f] = true); }
  isFormValid(): boolean { return !!(this.form.author && this.form.title && this.form.content); }

  touchReply(postId: number, field: string) {
    if (!this.replyTouched[postId]) this.replyTouched[postId] = {};
    (this.replyTouched[postId] as any)[field] = true;
  }

  submitPost() {
    this.touchAll();
    if (!this.isFormValid()) return;
    this.submitting = true;

    if (this.editingId) {
      this.forumService.update(this.editingId, this.form).subscribe({
        next: () => { this.submitting = false; this.successMsg = 'Post updated!'; this.resetForm(); this.load(); setTimeout(() => this.successMsg = '', 3000); },
        error: () => { this.submitting = false; }
      });
    } else {
      const fd = new FormData();
      fd.append('author', this.form.author);
      fd.append('title', this.form.title);
      fd.append('content', this.form.content);
      if (this.selectedFile) fd.append('image', this.selectedFile);
      if (this.selectedAudio) fd.append('audio', this.selectedAudio);
      if (this.form.videoUrl.trim()) fd.append('videoUrl', this.form.videoUrl.trim());
      this.forumService.create(fd).subscribe({
        next: () => { this.submitting = false; this.successMsg = 'Discussion posted!'; this.resetForm(); this.load(); setTimeout(() => this.successMsg = '', 3000); },
        error: () => { this.submitting = false; }
      });
    }
  }

  startEdit(p: ForumPost) {
    this.editingId = p.id!;
    this.form = { author: p.author, title: p.title, content: p.content, videoUrl: p.videoUrl || '' };
    this.touched = {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() { this.editingId = null; this.resetForm(); }

  resetForm() {
    this.editingId = null; this.touched = {};
    this.form = { author: '', title: '', content: '', videoUrl: '' };
    this.selectedFile = null; this.previewUrl = null;
    this.selectedAudio = null; this.audioPreviewUrl = null;
  }

  deletePost(id: number) {
    if (!confirm('Delete this post?')) return;
    this.forumService.delete(id).subscribe(() => this.load());
  }

  toggleReplies(p: ForumPost) {
    const id = p.id!;
    this.openReplies[id] = !this.openReplies[id];
    if (this.openReplies[id] && !this.repliesMap[id]) {
      this.forumService.getReplies(id).subscribe(r => this.repliesMap[id] = r);
    }
  }

  // NEW: submitReply fires a browser notification on success
  submitReply(postId: number) {
    const rf = this.replyForms[postId];
    if (!this.replyTouched[postId]) this.replyTouched[postId] = {};
    this.replyTouched[postId].author = true;
    this.replyTouched[postId].content = true;
    if (!rf?.author || !rf?.content) return;

    this.forumService.addReply(postId, rf).subscribe(reply => {
      if (!this.repliesMap[postId]) this.repliesMap[postId] = [];
      this.repliesMap[postId].push(reply);

      // Fire browser notification
      const post = this.posts.find(p => p.id === postId);
      if (post) this.fireReplyNotification(post.title, rf.author);

      this.replyForms[postId] = { author: '', content: '' };
      this.replyTouched[postId] = {};
    });
  }

  react(p: ForumPost, emoji: string) {
    this.forumService.addReaction(p.id!, emoji).subscribe(updated => {
      const idx = this.posts.findIndex(x => x.id === p.id);
      if (idx !== -1) { this.posts[idx] = updated; this.applyFilter(); }
    });
  }

  getSafeEmbedUrl(url: string): SafeResourceUrl {
    if (!url || url.trim() === '') return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    let embed = url.trim();
    if (embed.includes('youtube.com/embed/') || embed.includes('player.vimeo.com/video/'))
      return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    if (embed.includes('youtube.com/watch')) {
      try { const videoId = new URL(embed).searchParams.get('v') || ''; embed = 'https://www.youtube.com/embed/' + videoId; }
      catch { const match = embed.match(/[?&]v=([^&]+)/); if (match) embed = 'https://www.youtube.com/embed/' + match[1]; }
    } else if (embed.includes('youtu.be/')) {
      embed = 'https://www.youtube.com/embed/' + (embed.split('youtu.be/')[1]?.split('?')[0] || '');
    } else if (embed.includes('vimeo.com/')) {
      embed = 'https://player.vimeo.com/video/' + (embed.split('vimeo.com/')[1]?.split('?')[0] || '');
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  toggleSpeak(p: ForumPost) {
    const synth = window.speechSynthesis;
    if (this.speakingId === p.id) { synth.cancel(); this.speakingId = null; return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(p.content);
    utterance.rate = this.speechRate;
    utterance.onend = () => { this.speakingId = null; };
    utterance.onerror = () => { this.speakingId = null; };
    this.speakingId = p.id!;
    this.lastSpokenId = p.id!;
    synth.speak(utterance);
  }

  onRateChange(p: ForumPost) {
    if (this.speakingId === p.id) { this.toggleSpeak(p); setTimeout(() => this.toggleSpeak(p), 50); }
  }

  getReactionCount(p: ForumPost, emoji: string): number {
    if (!p.reactions) return 0;
    try { return JSON.parse(p.reactions)[emoji] || 0; } catch { return 0; }
  }
}