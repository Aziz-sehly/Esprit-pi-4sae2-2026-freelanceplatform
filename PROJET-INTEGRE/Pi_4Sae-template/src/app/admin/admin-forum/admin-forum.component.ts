import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Reply {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface ForumPost {
  id: number;
  author: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  reactions?: string;
  replies?: Reply[];
}

@Component({
  selector: 'app-admin-forum',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="admin-forum">
      <div class="page-header">
        <h1>Forum Management</h1>
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">{{ posts.length }}</span>
            <span class="stat-label">Total Posts</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ totalReplies }}</span>
            <span class="stat-label">Total Replies</span>
          </div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-head">
          <h2>All Forum Posts</h2>
        </div>

        <div class="loading" *ngIf="loading">Loading...</div>

        <div class="posts-grid" *ngIf="!loading">
          <div class="empty-state" *ngIf="posts.length === 0">
            No forum posts yet.
          </div>

          <div class="post-row" *ngFor="let p of posts">
            <div class="post-row-header">
              <div class="author-info">
                <div class="avatar">{{ p.author.charAt(0).toUpperCase() }}</div>
                <div>
                  <strong>{{ p.author }}</strong>
                  <span class="date">{{ p.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>

              <div class="post-badges">
                <span class="badge-replies">💬 {{ getRepliesCount(p) }} replies</span>
                <span class="badge-img" *ngIf="p.imageUrl">🖼 Image</span>
                <span class="badge-reactions" *ngIf="hasReactions(p)">{{ getTopReaction(p) }}</span>
              </div>

              <div class="post-row-actions">
                <button class="btn-view" (click)="toggleDetails(p.id)">
                  {{ expanded[p.id] ? 'Hide' : 'Details' }}
                </button>
                <button class="btn-delete" (click)="deletePost(p.id)">🗑 Delete</button>
              </div>
            </div>

            <h3 class="post-title">{{ p.title }}</h3>
            <p class="post-preview">{{ p.content }}</p>

            <!-- Expanded details -->
            <div class="post-details" *ngIf="expanded[p.id]">
              <div class="detail-image" *ngIf="p.imageUrl">
                <img [src]="'/api/forum-files' + p.imageUrl" alt="post image" />
              </div>

              <div class="reactions-display" *ngIf="hasReactions(p)">
                <strong>Reactions:</strong>
                <span *ngFor="let item of parseReactions(p)">{{ item.emoji }} {{ item.count }}</span>
              </div>

              <div class="replies-section" *ngIf="repliesMap[p.id]?.length">
                <strong>Replies ({{ repliesMap[p.id].length }}):</strong>
                <div class="reply-item" *ngFor="let r of repliesMap[p.id]">
                  <div class="reply-avatar">{{ r.author.charAt(0).toUpperCase() }}</div>
                  <div class="reply-body">
                    <strong>{{ r.author }}</strong>
                    <span class="date">{{ r.createdAt | date:'short' }}</span>
                    <p>{{ r.content }}</p>
                  </div>
                  <button class="btn-delete-sm" (click)="deleteReply(r.id, p.id)">✕</button>
                </div>
              </div>

              <button class="btn-load-replies" (click)="loadReplies(p.id)" *ngIf="!repliesMap[p.id]">
                Load Replies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-forum {
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
    }

    .stat-num {
      font-size: 2rem;
      font-weight: 700;
      color: #0a0e27;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #9ca3af;
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

    .loading, .empty-state {
      padding: 3rem;
      text-align: center;
      color: #9ca3af;
    }

    .post-row {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: #fafafa; }
    }

    .post-row-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .author-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;

      .avatar {
        width: 40px; height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff006e, #00d9ff);
        color: white;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }

      strong { display: block; color: #0a0e27; font-size: 0.95rem; }
      .date { font-size: 0.8rem; color: #9ca3af; }
    }

    .post-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge-replies, .badge-img, .badge-reactions {
      font-size: 0.8rem;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 600;
    }

    .badge-replies { background: #e0f2fe; color: #0369a1; }
    .badge-img { background: #fef3c7; color: #92400e; }
    .badge-reactions { background: #fce7f3; color: #9d174d; }

    .post-row-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-view {
      background: #f3f4f6;
      border: none;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      color: #374151;
      &:hover { background: #e5e7eb; }
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

    .post-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #0a0e27;
      margin-bottom: 0.4rem;
    }

    .post-preview {
      color: #6b7280;
      font-size: 0.92rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-details {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px dashed #e5e7eb;
    }

    .detail-image {
      margin-bottom: 1rem;
      img {
        max-width: 300px;
        max-height: 200px;
        border-radius: 10px;
        object-fit: cover;
      }
    }

    .reactions-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      font-size: 0.95rem;
      color: #374151;
      strong { color: #0a0e27; }
    }

    .replies-section {
      margin-top: 0.75rem;
      strong { display: block; color: #0a0e27; margin-bottom: 0.75rem; font-size: 0.95rem; }
    }

    .reply-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.6rem 0;
      border-top: 1px solid #f3f4f6;
    }

    .reply-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .reply-body {
      flex: 1;
      strong { display: inline; color: #0a0e27; margin-right: 0.5rem; font-size: 0.9rem; }
      .date { font-size: 0.78rem; color: #9ca3af; }
      p { margin-top: 0.2rem; color: #374151; font-size: 0.9rem; }
    }

    .btn-delete-sm {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      width: 26px; height: 26px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &:hover { background: #fecaca; }
    }

    .btn-load-replies {
      background: #f3f4f6;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      color: #374151;
      margin-top: 0.75rem;
      &:hover { background: #e5e7eb; }
    }
  `]
})
export class AdminForumComponent implements OnInit {
  posts: ForumPost[] = [];
  repliesMap: { [id: number]: Reply[] } = {};
  expanded: { [id: number]: boolean } = {};
  loading = true;
  totalReplies = 0;

  private api = '/api/posts';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<ForumPost[]>(this.api).subscribe({
      next: (data) => { this.posts = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleDetails(id: number) {
    this.expanded[id] = !this.expanded[id];
    if (this.expanded[id] && !this.repliesMap[id]) {
      this.loadReplies(id);
    }
  }

  loadReplies(postId: number) {
    this.http.get<Reply[]>(`${this.api}/${postId}/replies`).subscribe(r => {
      this.repliesMap[postId] = r;
      this.totalReplies = Object.values(this.repliesMap).reduce((sum, arr) => sum + arr.length, 0);
    });
  }

  deletePost(id: number) {
    if (!confirm('Delete this post and all its replies?')) return;
    this.http.delete(`${this.api}/${id}`).subscribe(() => {
      this.posts = this.posts.filter(p => p.id !== id);
    });
  }

  deleteReply(replyId: number, postId: number) {
    if (!confirm('Delete this reply?')) return;
    this.http.delete(`${this.api}/replies/${replyId}`).subscribe(() => {
      this.repliesMap[postId] = this.repliesMap[postId].filter(r => r.id !== replyId);
    });
  }

  getRepliesCount(p: ForumPost): number {
    return this.repliesMap[p.id]?.length ?? 0;
  }

  hasReactions(p: ForumPost): boolean {
    if (!p.reactions || p.reactions === '{}') return false;
    try { return Object.keys(JSON.parse(p.reactions)).length > 0; } catch { return false; }
  }

  getTopReaction(p: ForumPost): string {
    try {
      const map = JSON.parse(p.reactions!);
      const top = Object.entries(map).sort((a: any, b: any) => b[1] - a[1])[0];
      return top ? `${top[0]} ${top[1]}` : '';
    } catch { return ''; }
  }

  parseReactions(p: ForumPost): { emoji: string; count: number }[] {
    try {
      const map = JSON.parse(p.reactions!);
      return Object.entries(map).map(([emoji, count]) => ({ emoji, count: count as number }));
    } catch { return []; }
  }
}