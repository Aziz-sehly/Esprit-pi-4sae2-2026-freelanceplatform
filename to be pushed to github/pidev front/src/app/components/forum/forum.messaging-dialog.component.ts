import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumMessageService, ChatMessage, InboxEntry } from '../../services/forum.message.service';

@Component({
  selector: 'app-messaging-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating button -->
    <button class="msg-fab" (click)="toggleDialog()" title="Messages">
      💬
      <span class="msg-badge" *ngIf="inboxCount > 0">{{ inboxCount }}</span>
    </button>

    <!-- Dialog overlay -->
    <div class="msg-overlay" *ngIf="open" (click)="onOverlayClick($event)">
      <div class="msg-dialog" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="msg-header">
          <span *ngIf="!activeRecipient">💬 Messages</span>
          <span *ngIf="activeRecipient" class="msg-back" (click)="backToInbox()">
            ← {{ activeRecipient.name }}
          </span>
          <button class="msg-close" (click)="open = false">✕</button>
        </div>

        <!-- INBOX VIEW -->
        <ng-container *ngIf="!activeRecipient">

          <!-- New message input -->
          <div class="msg-new">
            <input
              [(ngModel)]="searchEmail"
              placeholder="Enter user email to start a chat…"
              (keyup.enter)="startChat()"
              class="msg-input" />
            <button class="msg-send-btn" (click)="startChat()">Start</button>
          </div>
          <div class="msg-error" *ngIf="searchError">{{ searchError }}</div>

          <!-- Conversation list -->
          <div class="msg-inbox" *ngIf="inbox.length > 0">
            <div
              class="msg-inbox-row"
              *ngFor="let entry of inbox"
              (click)="openConversation(entry)">
              <div class="msg-inbox-name">
                {{ entry.senderId === myId ? entry.recipientName : entry.senderName }}
              </div>
              <div class="msg-inbox-preview">{{ entry.content }}</div>
            </div>
          </div>
          <div class="msg-empty" *ngIf="inbox.length === 0">No conversations yet.</div>
        </ng-container>

        <!-- CONVERSATION VIEW -->
        <ng-container *ngIf="activeRecipient">
          <div class="msg-thread" #thread>
            <div
              *ngFor="let m of conversation"
              class="msg-bubble"
              [class.msg-mine]="m.senderId === myId"
              [class.msg-theirs]="m.senderId !== myId">
              <div class="msg-text">{{ m.content }}</div>
              <div class="msg-time">{{ m.sentAt | date:'HH:mm' }}</div>
            </div>
            <div class="msg-empty" *ngIf="conversation.length === 0">
              Say hello! 👋
            </div>
          </div>

          <div class="msg-compose">
            <input
              [(ngModel)]="newMessage"
              placeholder="Type a message…"
              (keyup.enter)="sendMessage()"
              class="msg-input" />
            <button class="msg-send-btn" (click)="sendMessage()">Send</button>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    /* Floating button */
    .msg-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #4f46e5;
      color: white;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(79,70,229,0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s;
    }
    .msg-fab:hover { transform: scale(1.1); }
    .msg-badge {
      position: absolute;
      top: 4px; right: 4px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      border-radius: 50%;
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
    }

    /* Overlay */
    .msg-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      z-index: 1001;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 0 2rem 6rem 0;
    }

    /* Dialog box */
    .msg-dialog {
      width: 360px;
      max-height: 520px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .msg-header {
      background: #4f46e5;
      color: white;
      padding: 0.9rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    .msg-back { cursor: pointer; }
    .msg-back:hover { text-decoration: underline; }
    .msg-close {
      background: none; border: none; color: white;
      font-size: 1.1rem; cursor: pointer; line-height: 1;
    }

    /* New chat input row */
    .msg-new {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    /* Shared input */
    .msg-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
    }
    .msg-input:focus { border-color: #4f46e5; }

    /* Send / Start button */
    .msg-send-btn {
      padding: 0.5rem 0.9rem;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      white-space: nowrap;
    }
    .msg-send-btn:hover { background: #4338ca; }

    /* Error */
    .msg-error {
      color: #ef4444;
      font-size: 0.8rem;
      padding: 0 0.75rem 0.5rem;
    }

    /* Inbox list */
    .msg-inbox { overflow-y: auto; flex: 1; }
    .msg-inbox-row {
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }
    .msg-inbox-row:hover { background: #f9fafb; }
    .msg-inbox-name { font-weight: 600; font-size: 0.9rem; color: #111827; }
    .msg-inbox-preview {
      font-size: 0.8rem; color: #6b7280;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Thread */
    .msg-thread {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 360px;
    }
    .msg-bubble {
      max-width: 75%;
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .msg-mine {
      align-self: flex-end;
      background: #4f46e5;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .msg-theirs {
      align-self: flex-start;
      background: #f3f4f6;
      color: #111827;
      border-bottom-left-radius: 4px;
    }
    .msg-time { font-size: 0.7rem; opacity: 0.65; margin-top: 2px; text-align: right; }

    /* Compose row */
    .msg-compose {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Empty state */
    .msg-empty {
      text-align: center;
      color: #9ca3af;
      font-size: 0.875rem;
      padding: 2rem 1rem;
    }
  `]
})
export class ForumMessagingDialogComponent implements OnInit, OnDestroy {

  open = false;
  inbox: InboxEntry[] = [];
  inboxCount = 0;
  conversation: ChatMessage[] = [];
  activeRecipient: { id: number; name: string } | null = null;

  searchEmail = '';
  searchError = '';
  newMessage = '';
  myId = 0;

  private pollInterval: any;

  constructor(private msgService: ForumMessageService) {}

  ngOnInit() {
    this.myId = this.getMyId();
    this.loadInbox();
    // Poll inbox every 10 seconds
    this.pollInterval = setInterval(() => this.loadInbox(), 10000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  toggleDialog() {
    this.open = !this.open;
    if (this.open) this.loadInbox();
  }

  onOverlayClick(e: MouseEvent) {
    this.open = false;
  }

  loadInbox() {
    this.msgService.getInbox().subscribe({
      next: (entries) => {
        this.inbox = entries;
        this.inboxCount = entries.length;
      },
      error: () => {} // silently fail if not logged in yet
    });
  }

  startChat() {
    this.searchError = '';
    if (!this.searchEmail.trim()) return;
    this.msgService.getUserByEmail(this.searchEmail.trim()).subscribe({
      next: (user) => {
        this.activeRecipient = { id: user.id, name: user.firstName + ' ' + user.lastName };
        this.loadConversation();
        this.searchEmail = '';
      },
      error: () => {
        this.searchError = 'User not found. Check the email and try again.';
      }
    });
  }

  openConversation(entry: InboxEntry) {
    const isMe = entry.senderId === this.myId;
    this.activeRecipient = {
      id: isMe ? entry.recipientId : entry.senderId,
      name: isMe ? entry.recipientName : entry.senderName
    };
    this.loadConversation();
  }

  loadConversation() {
    if (!this.activeRecipient) return;
    this.msgService.getConversation(this.activeRecipient.id).subscribe({
      next: (msgs) => { this.conversation = msgs; }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeRecipient) return;
    this.msgService.sendMessage(this.activeRecipient.id, this.newMessage.trim()).subscribe({
      next: (msg) => {
        this.conversation.push(msg);
        this.newMessage = '';
      }
    });
  }

  backToInbox() {
    this.activeRecipient = null;
    this.conversation = [];
    this.loadInbox();
  }

  private getMyId(): number {
    try {
      const token = localStorage.getItem('token') || '';
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || 0;
    } catch {
      return 0;
    }
  }
}