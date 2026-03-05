import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../services/forum.service';
import { ForumPost, Reply } from '../../models/forum.model';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

          <!-- Author -->
          <div class="form-group">
            <label>Your Name</label>
            <input
              [(ngModel)]="form.author"
              placeholder="e.g. John Doe"
              [class.input-error]="touched['author'] && !form.author"
              (ngModelChange)="touch('author')" />
            <span class="error-msg" *ngIf="touched['author'] && !form.author">
              ⚠ Please enter your name.
            </span>
          </div>

          <!-- Title -->
          <div class="form-group">
            <label>Title</label>
            <input
              [(ngModel)]="form.title"
              placeholder="What's your question or topic?"
              [class.input-error]="touched['title'] && !form.title"
              (ngModelChange)="touch('title')" />
            <span class="error-msg" *ngIf="touched['title'] && !form.title">
              ⚠ Please enter a title for your post.
            </span>
          </div>

          <!-- Content -->
          <div class="form-group">
            <label>Content</label>
            <textarea
              [(ngModel)]="form.content"
              rows="4"
              placeholder="Describe in detail..."
              [class.input-error]="touched['content'] && !form.content"
              (ngModelChange)="touch('content')"></textarea>
            <span class="error-msg" *ngIf="touched['content'] && !form.content">
              ⚠ Please write your post content.
            </span>
          </div>

          <!-- Image upload (only on create) -->
          <div class="form-group" *ngIf="!editingId">
            <label>Image (optional)</label>
            <input type="file" accept="image/*" (change)="onFileSelect($event)" />
            <div class="image-preview" *ngIf="previewUrl">
              <img [src]="previewUrl" alt="Preview" />
            </div>
          </div>

          <!-- NEW: Audio/MP3 upload (only on create) -->
          <div class="form-group" *ngIf="!editingId">
            <label>🎵 Audio / Voicemail (optional — MP3, WAV, OGG)</label>
            <input type="file" accept="audio/*" (change)="onAudioSelect($event)" />
            <div class="audio-preview" *ngIf="audioPreviewUrl">
              <audio controls [src]="audioPreviewUrl"></audio>
              <button class="btn-remove-audio" (click)="removeAudio()">✕ Remove audio</button>
            </div>
          </div>

          <!-- NEW: YouTube / Vimeo URL (only on create) -->
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
            <h2>Discussions <span class="count">({{ posts.length }})</span></h2>
          </div>

          <div class="loading" *ngIf="loading">Loading posts...</div>
          <div class="empty" *ngIf="!loading && posts.length === 0">No discussions yet. Start one!</div>

          <div class="post-card" *ngFor="let p of posts">
            <!-- Post header -->
            <div class="post-header">
              <div class="avatar">{{ p.author.charAt(0).toUpperCase() }}</div>
              <div class="post-meta">
                <strong>{{ p.author }}</strong>
                <span class="date">{{ p.createdAt | date:'medium' }}</span>
              </div>
              <div class="post-actions">
                <button class="btn-icon" (click)="startEdit(p)" title="Edit">✏️</button>
                <button class="btn-icon danger" (click)="deletePost(p.id!)" title="Delete">🗑️</button>
              </div>
            </div>

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
                <input type="range" min="0.5" max="2" step="0.25"
                  [(ngModel)]="speechRate"
                  (ngModelChange)="onRateChange(p)" />
                <span class="speed-label">{{ speechRate }}x</span>
              </div>
            </div>

            <!-- Image -->
            <div class="post-image" *ngIf="p.imageUrl">
              <img [src]="'http://localhost:8082' + p.imageUrl" [alt]="p.title" />
            </div>

            <!-- NEW: Inline audio player -->
            <div class="post-audio" *ngIf="p.audioUrl">
              <div class="audio-label">
                <span class="audio-icon">🎵</span>
                <span>Audio attachment</span>
              </div>
              <audio controls [src]="'http://localhost:8082' + p.audioUrl"></audio>
            </div>

            <!-- NEW: Embedded video player -->
            <div class="post-video" *ngIf="p.videoUrl && p.videoUrl.trim() !== ''">
              <iframe [src]="getSafeEmbedUrl(p.videoUrl)" frameborder="0"
                allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
            </div>

            <!-- Reactions -->
            <div class="reactions-bar">
              <span class="reaction-label">React:</span>
              <button class="emoji-btn" *ngFor="let e of emojiList" (click)="react(p, e)">
                {{ e }} <span class="emoji-count">{{ getReactionCount(p, e) }}</span>
              </button>
            </div>

            <!-- Replies toggle -->
            <div class="replies-section">
              <button class="btn-replies-toggle" (click)="toggleReplies(p)">
                {{ openReplies[p.id!] ? '▲ Hide Replies' : '▼ Show Replies (' + (repliesMap[p.id!] ? repliesMap[p.id!].length : 0) + ')' }}
              </button>

              <div class="replies-list" *ngIf="openReplies[p.id!]">
                <div class="reply-card" *ngFor="let r of repliesMap[p.id!]">
                  <div class="reply-avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
                  <div class="reply-body">
                    <strong>{{ r.author }}</strong>
                    <span class="date">{{ r.createdAt | date:'shortTime' }}</span>
                    <p>{{ r.content }}</p>
                  </div>
                </div>

                <!-- Add reply form with validation -->
                <div class="add-reply-form">
                  <input
                    [(ngModel)]="replyForms[p.id!].author"
                    placeholder="Your name"
                    [class.input-error]="replyTouched[p.id!] && replyTouched[p.id!]['author'] && !replyForms[p.id!].author"
                    (ngModelChange)="touchReply(p.id!, 'author')" />
                  <span class="error-msg" *ngIf="replyTouched[p.id!] && replyTouched[p.id!]['author'] && !replyForms[p.id!].author">
                    ⚠ Please enter your name.
                  </span>
                  <textarea
                    [(ngModel)]="replyForms[p.id!].content"
                    rows="2"
                    placeholder="Write a reply..."
                    [class.input-error]="replyTouched[p.id!] && replyTouched[p.id!]['content'] && !replyForms[p.id!].content"
                    (ngModelChange)="touchReply(p.id!, 'content')"></textarea>
                  <span class="error-msg" *ngIf="replyTouched[p.id!] && replyTouched[p.id!]['content'] && !replyForms[p.id!].content">
                    ⚠ Please write your reply before submitting.
                  </span>
                  <button class="btn-reply" (click)="submitReply(p.id!)">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
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
    .hero-inner h1 {
      font-family: 'Syne', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }
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
      input[type="text"], input:not([type="file"]):not([type="checkbox"]), textarea, select {
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
      input[type="file"] {
        font-size: 0.95rem;
        color: #374151;
      }
      textarea { resize: vertical; }
    }

    /* Validation styles */
    .input-error {
      border-color: #ef4444 !important;
    }

    .error-msg {
      display: block;
      color: #ef4444;
      font-size: 0.82rem;
      font-weight: 600;
      margin-top: 0.3rem;
    }

    .image-preview {
      margin-top: 0.75rem;
      img {
        max-width: 200px;
        max-height: 150px;
        border-radius: 10px;
        object-fit: cover;
        border: 2px solid #e5e7eb;
      }
    }

    /* NEW: Audio preview in the form */
    .audio-preview {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      audio {
        height: 40px;
        border-radius: 8px;
      }
    }

    .btn-remove-audio {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #fecaca; }
    }

    .form-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }

    .btn-submit {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: inherit;
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
      font-family: inherit;
      &:hover { background: #e5e7eb; }
    }

    .success-msg { margin-top: 1rem; color: #10b981; font-weight: 600; }

    .posts-list h2 {
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

    .post-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 2px 12px rgba(10,14,39,0.06);
      margin-bottom: 1.25rem;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 6px 24px rgba(10,14,39,0.1); }
    }

    .post-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff006e, #00d9ff);
      color: white;
      font-weight: 700;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .post-meta {
      flex: 1;
      strong { display: block; color: #0a0e27; margin-bottom: 4px; }
      .date { font-size: 0.85rem; color: #9ca3af; }
    }

    .post-actions { display: flex; gap: 0.5rem; }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px 8px;
      border-radius: 8px;
      &:hover { background: #f3f4f6; }
      &.danger:hover { background: #fee2e2; }
    }

    .post-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.25rem;
      color: #0a0e27;
      margin-bottom: 0.75rem;
    }

    .post-content {
      color: #374151;
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .post-image {
      margin-bottom: 1rem;
      img {
        max-width: 100%;
        max-height: 350px;
        border-radius: 12px;
        object-fit: cover;
      }
    }

    /* NEW: Inline audio player in post cards */
    .post-audio {
      margin-bottom: 1rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 0.75rem 1rem;

      .audio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #0369a1;
        margin-bottom: 0.5rem;

        .audio-icon { font-size: 1rem; }
      }

      audio {
        width: 100%;
        height: 40px;
        border-radius: 8px;
      }
    }

    /* Text-to-speech bar */
    /* Video embed */
    .post-video {
      margin: 0.75rem 0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      padding-bottom: 56.25%; /* 16:9 ratio */
      height: 0;
      background: #000;

      iframe {
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    .video-url-input {
      width: 100%;
      padding: 0.6rem 0.9rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.2s;
      box-sizing: border-box;
      &:focus { outline: none; border-color: #0099ff; }
    }

    .video-preview {
      margin-top: 0.75rem;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      background: #000;

      iframe {
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    .tts-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .tts-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #f3f4f6;
      border: none;
      border-radius: 20px;
      padding: 0.35rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s, color 0.2s;
      &:hover { background: #e5e7eb; }
      &.speaking {
        background: #eff6ff;
        color: #1d4ed8;
        animation: pulse-tts 1.5s ease-in-out infinite;
      }
      .tts-icon { font-size: 1rem; }
    }

    @keyframes pulse-tts {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .tts-speed {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #6b7280;
      label { font-weight: 600; white-space: nowrap; }
      input[type="range"] {
        width: 90px;
        accent-color: #0099ff;
        cursor: pointer;
        padding: 0;
        border: none;
        background: none;
        height: auto;
      }
      .speed-label { font-weight: 700; color: #0099ff; min-width: 32px; }
    }

    .reactions-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0;
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .reaction-label { color: #9ca3af; font-size: 0.85rem; margin-right: 0.25rem; }

    .emoji-btn {
      background: #f3f4f6;
      border: none;
      border-radius: 20px;
      padding: 0.3rem 0.75rem;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s, transform 0.15s;
      &:hover { background: #e5e7eb; transform: scale(1.1); }
      .emoji-count { font-size: 0.8rem; color: #6b7280; font-weight: 600; }
    }

    .btn-replies-toggle {
      background: none;
      border: none;
      color: #0099ff;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0;
      font-family: inherit;
      &:hover { text-decoration: underline; }
    }

    .replies-list { margin-top: 1rem; }

    .reply-card {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-top: 1px solid #f3f4f6;
    }

    .reply-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .reply-body {
      flex: 1;
      strong { display: inline; color: #0a0e27; margin-right: 0.5rem; }
      .date { font-size: 0.8rem; color: #9ca3af; }
      p { margin-top: 0.25rem; color: #374151; font-size: 0.95rem; line-height: 1.6; }
    }

    .add-reply-form {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px dashed #e5e7eb;

      input, textarea {
        width: 100%;
        padding: 0.6rem 0.9rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.95rem;
        font-family: inherit;
        &:focus { outline: none; border-color: #00d9ff; }
      }
      textarea { resize: none; }
    }

    .btn-reply {
      align-self: flex-end;
      padding: 0.5rem 1.5rem;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      &:hover { opacity: 0.9; }
    }
  `]
})
export class ForumComponent implements OnInit {
  posts: ForumPost[] = [];
  loading = true;
  submitting = false;
  successMsg = '';
  editingId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  selectedAudio: File | null = null;        // NEW
  audioPreviewUrl: string | null = null;    // NEW

  openReplies: { [id: number]: boolean } = {};
  repliesMap: { [id: number]: Reply[] } = {};
  replyForms: { [id: number]: { author: string; content: string } } = {};

  // Validation touched state for the main form and reply forms
  touched: { [key: string]: boolean } = {};
  replyTouched: { [postId: number]: { author?: boolean; content?: boolean } } = {};

  emojiList = ['👍', '❤️', '😂', '😮', '🔥', '👏'];

  // Text-to-speech state
  speakingId: number | null = null;
  lastSpokenId: number | null = null;
  speechRate: number = 1;

  form = { author: '', title: '', content: '', videoUrl: '' };

  constructor(private forumService: ForumService, private sanitizer: DomSanitizer) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.forumService.getAll().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
        data.forEach(p => {
          if (!this.replyForms[p.id!]) {
            this.replyForms[p.id!] = { author: '', content: '' };
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewUrl = e.target.result;
    reader.readAsDataURL(file);
  }

  // NEW: handle audio file selection
  onAudioSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedAudio = file;
    this.audioPreviewUrl = URL.createObjectURL(file);
  }

  // NEW: remove audio selection
  removeAudio() {
    this.selectedAudio = null;
    this.audioPreviewUrl = null;
  }

  touch(field: string) {
    this.touched[field] = true;
  }

  touchAll() {
    ['author', 'title', 'content'].forEach(f => this.touched[f] = true);
  }

  isFormValid(): boolean {
    return !!(this.form.author && this.form.title && this.form.content);
  }

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
        next: () => {
          this.submitting = false;
          this.successMsg = 'Post updated!';
          this.resetForm();
          this.load();
          setTimeout(() => this.successMsg = '', 3000);
        },
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
        next: () => {
          this.submitting = false;
          this.successMsg = 'Discussion posted!';
          this.resetForm();
          this.load();
          setTimeout(() => this.successMsg = '', 3000);
        },
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
    this.editingId = null;
    this.touched = {};
    this.form = { author: '', title: '', content: '', videoUrl: '' };
    this.selectedFile = null;
    this.previewUrl = null;
    this.selectedAudio = null;
    this.audioPreviewUrl = null;
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

  submitReply(postId: number) {
    const rf = this.replyForms[postId];
    if (!this.replyTouched[postId]) this.replyTouched[postId] = {};
    this.replyTouched[postId].author = true;
    this.replyTouched[postId].content = true;
    if (!rf?.author || !rf?.content) return;

    this.forumService.addReply(postId, rf).subscribe(reply => {
      if (!this.repliesMap[postId]) this.repliesMap[postId] = [];
      this.repliesMap[postId].push(reply);
      this.replyForms[postId] = { author: '', content: '' };
      this.replyTouched[postId] = {};
    });
  }

  react(p: ForumPost, emoji: string) {
    this.forumService.addReaction(p.id!, emoji).subscribe(updated => {
      const idx = this.posts.findIndex(x => x.id === p.id);
      if (idx !== -1) this.posts[idx] = updated;
    });
  }

  // ── Video embed helper ──────────────────────────────
  getSafeEmbedUrl(url: string): SafeResourceUrl {
    if (!url || url.trim() === '') {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }
    let embed = url.trim();

    // Already an embed URL — return as-is
    if (embed.includes('youtube.com/embed/') || embed.includes('player.vimeo.com/video/')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    }

    // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (embed.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(embed).searchParams.get('v') || '';
        embed = 'https://www.youtube.com/embed/' + videoId;
      } catch {
        const match = embed.match(/[?&]v=([^&]+)/);
        if (match) embed = 'https://www.youtube.com/embed/' + match[1];
      }
    }
    // YouTube short URL: https://youtu.be/VIDEO_ID
    else if (embed.includes('youtu.be/')) {
      const id = embed.split('youtu.be/')[1]?.split('?')[0] || '';
      embed = 'https://www.youtube.com/embed/' + id;
    }
    // Vimeo: https://vimeo.com/VIDEO_ID
    else if (embed.includes('vimeo.com/')) {
      const id = embed.split('vimeo.com/')[1]?.split('?')[0] || '';
      embed = 'https://player.vimeo.com/video/' + id;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  // ── Text-to-speech ──────────────────────────────────
  toggleSpeak(p: ForumPost) {
    const synth = window.speechSynthesis;
    if (this.speakingId === p.id) {
      synth.cancel();
      this.speakingId = null;
      return;
    }
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
    if (this.speakingId === p.id) {
      // restart with new rate
      this.toggleSpeak(p);
      setTimeout(() => this.toggleSpeak(p), 50);
    }
  }

  getReactionCount(p: ForumPost, emoji: string): number {
    if (!p.reactions) return 0;
    try {
      const map = JSON.parse(p.reactions);
      return map[emoji] || 0;
    } catch { return 0; }
  }
}