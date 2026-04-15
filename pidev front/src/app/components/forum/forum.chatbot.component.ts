import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { icon: '🔍', text: 'How do I find a good frontend developer on this platform?' },
  { icon: '📝', text: 'What should I include in a strong job proposal?' },
  { icon: '💰', text: 'How do I set my freelance rate as a beginner?' },
  { icon: '🤝', text: 'What makes a good client-freelancer relationship?' },
  { icon: '⚙️', text: 'How do I fix CORS errors in Spring Boot?' },
  { icon: '🐛', text: 'What are the best debugging strategies for JavaScript?' },
  { icon: '🔀', text: 'How do I handle merge conflicts in Git?' },
  { icon: '🏗️', text: 'What is the difference between REST and GraphQL?' },
  { icon: '🚀', text: 'How do I deploy a Spring Boot app to production?' },
  { icon: '📱', text: 'What are the best practices for responsive Angular design?' },
];

@Component({
  selector: 'app-forum-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating trigger button -->
    <button
      class="chat-fab"
      (click)="togglePanel()"
      [class.fab-open]="isOpen"
      title="{{ isOpen ? 'Close AI Assistant' : 'Open AI Assistant' }}"
      aria-label="Toggle AI Assistant">
      <span class="fab-icon">{{ isOpen ? '✕' : '💬' }}</span>
      <span class="fab-label" *ngIf="!isOpen">AI Assistant</span>
    </button>

    <!-- Side panel -->
    <div class="chat-panel" [class.panel-open]="isOpen" role="dialog" aria-label="AI Assistant">

      <!-- Panel header -->
      <div class="panel-header">
        <div class="header-left">
          <div class="ai-avatar">🤖</div>
          <div class="header-info">
            <span class="header-title">AI Assistant</span>
            <span class="status-dot"></span>
            <span class="status-text">Online</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="clear-btn" (click)="clearChat()" title="Clear conversation">🗑️</button>
          <button class="close-btn" (click)="togglePanel()" title="Close">✕</button>
        </div>
      </div>

      <!-- Suggested questions (shown only when chat is empty) -->
      <div class="suggestions-panel" *ngIf="messages.length === 0 && !loading">
        <p class="suggestions-title">✨ Pick a question or ask your own:</p>
        <div class="suggestions-list">
          <button
            class="suggestion-chip"
            *ngFor="let q of suggestedQuestions"
            (click)="pasteQuestion(q.text)">
            <span class="chip-icon">{{ q.icon }}</span>
            <span class="chip-text">{{ q.text }}</span>
          </button>
        </div>
      </div>

      <!-- Messages area -->
      <div class="messages-area" #messagesArea>

        <!-- Welcome message -->
        <div class="message assistant-message" *ngIf="messages.length === 0 && !loading">
          <div class="msg-avatar assistant-avatar">🤖</div>
          <div class="msg-bubble assistant-bubble">
            <p>👋 Hello! I'm your <strong>AI Assistant</strong>.</p>
            <p>I can help you:</p>
            <ul>
              <li>🔍 Find the right freelancer for your project</li>
              <li>📋 Write better proposals and job posts</li>
              <li>💻 Solve programming &amp; computer science issues</li>
              <li>🚀 Navigate the platform and get the most out of it</li>
            </ul>
            <p>What can I help you with today?</p>
          </div>
        </div>

        <!-- Chat messages -->
        <div
          *ngFor="let msg of messages"
          class="message"
          [class.user-message]="msg.role === 'user'"
          [class.assistant-message]="msg.role === 'assistant'">
          <div class="msg-avatar"
               [class.user-avatar]="msg.role === 'user'"
               [class.assistant-avatar]="msg.role === 'assistant'">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="msg-bubble"
               [class.user-bubble]="msg.role === 'user'"
               [class.assistant-bubble]="msg.role === 'assistant'">
            <div class="msg-content" [innerHTML]="formatMessage(msg.content)"></div>
            <span class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</span>
          </div>
        </div>

        <!-- Typing indicator -->
        <div class="message assistant-message" *ngIf="loading">
          <div class="msg-avatar assistant-avatar">🤖</div>
          <div class="msg-bubble assistant-bubble typing-bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div class="error-banner" *ngIf="error">
          ⚠️ {{ error }}
          <button class="retry-btn" (click)="retry()">Retry</button>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <div class="input-wrap">
          <textarea
            [(ngModel)]="userInput"
            (keydown.enter)="onEnter($any($event))"
            placeholder="Ask me anything... (Enter to send)"
            rows="1"
            [disabled]="loading"
            class="chat-input"
            (input)="autoResize($event)">
          </textarea>
          <button
            class="send-btn"
            (click)="sendMessage()"
            [disabled]="loading || !userInput.trim()">
            <span *ngIf="!loading">➤</span>
            <span *ngIf="loading" class="spin">⏳</span>
          </button>
        </div>
        <p class="input-hint">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ── Floating Action Button ── */
    .chat-fab {
      position: absolute;
      bottom: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.2rem;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f45 100%);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: inherit;
      box-shadow: 0 4px 20px rgba(0, 153, 255, 0.35);
      transition: all 0.25s ease;
      white-space: nowrap;
      z-index: 1001;
    }

    .chat-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0, 153, 255, 0.5);
    }

    .chat-fab.fab-open {
      border-radius: 50%;
      padding: 0.75rem;
      width: 46px;
      height: 46px;
      justify-content: center;
    }

    .fab-icon { font-size: 1.2rem; }
    .fab-label { font-size: 0.88rem; }

    /* ── Side Panel ── */
    .chat-panel {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 380px;
      height: 560px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(16px) scale(0.97);
      transform-origin: bottom right;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .chat-panel.panel-open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0) scale(1);
    }

    /* ── Panel header ── */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1rem;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f45 100%);
      color: white;
      flex-shrink: 0;
    }

    .header-left { display: flex; align-items: center; gap: 0.6rem; }

    .ai-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 0 10px rgba(0,217,255,0.4);
      flex-shrink: 0;
    }

    .header-info {
      display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
    }
    .header-title { font-weight: 700; font-size: 0.95rem; }

    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 5px #22c55e;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .status-text { font-size: 0.75rem; color: #94a3b8; }

    .header-actions { display: flex; gap: 0.35rem; }

    .clear-btn, .close-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white; border-radius: 7px;
      width: 30px; height: 30px;
      cursor: pointer; font-size: 0.8rem;
      transition: background 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .clear-btn:hover, .close-btn:hover { background: rgba(255,255,255,0.22); }

    /* ── Suggestions ── */
    .suggestions-panel {
      background: #f8faff;
      border-bottom: 1px solid #e5e7f0;
      padding: 0.6rem 0.75rem;
      flex-shrink: 0;
      max-height: 170px;
      overflow-y: auto;
    }

    .suggestions-title {
      margin: 0 0 0.5rem;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .suggestion-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.6rem;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      font-family: inherit;
      font-size: 0.78rem;
      color: #374151;
      width: 100%;
    }
    .suggestion-chip:hover {
      border-color: #00d9ff;
      background: #f0fdff;
      transform: translateX(2px);
    }
    .chip-icon { font-size: 0.9rem; flex-shrink: 0; }

    /* ── Messages ── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      scroll-behavior: smooth;
    }
    .messages-area::-webkit-scrollbar { width: 4px; }
    .messages-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    .message {
      display: flex;
      gap: 0.5rem;
      animation: fadeSlideIn 0.2s ease-out;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .user-message { flex-direction: row-reverse; }

    .msg-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .user-avatar { background: linear-gradient(135deg, #00d9ff, #0099ff); }
    .assistant-avatar { background: linear-gradient(135deg, #1a1f45, #0a0e27); }

    .msg-bubble {
      max-width: 78%;
      padding: 0.55rem 0.8rem;
      border-radius: 14px;
      position: relative;
    }
    .user-bubble {
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .assistant-bubble {
      background: #f8faff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
    }

    .msg-content {
      font-size: 0.83rem;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg-content p { margin: 0 0 0.35rem; }
    .msg-content p:last-child { margin-bottom: 0; }
    .msg-content ul, .msg-content ol { margin: 0.2rem 0 0.35rem 1rem; }
    .msg-content li { margin-bottom: 0.15rem; }
    .msg-content strong { font-weight: 600; }
    .msg-content code {
      background: rgba(0,0,0,0.08);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.82em;
    }
    .user-bubble .msg-content code { background: rgba(255,255,255,0.2); }

    .msg-time {
      display: block;
      font-size: 0.65rem;
      opacity: 0.5;
      margin-top: 0.25rem;
      text-align: right;
    }

    /* ── Typing dots ── */
    .typing-bubble { padding: 0.7rem 0.9rem; }
    .typing-dots {
      display: flex; gap: 4px; align-items: center;
    }
    .typing-dots span {
      width: 7px; height: 7px;
      background: #94a3b8; border-radius: 50%;
      animation: bounce 1.2s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40%           { transform: translateY(-6px); }
    }

    /* ── Error ── */
    .error-banner {
      background: #fef2f2; border: 1px solid #fecaca;
      color: #dc2626; border-radius: 8px;
      padding: 0.55rem 0.75rem;
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.8rem;
    }
    .retry-btn {
      margin-left: auto; background: #dc2626;
      color: white; border: none; border-radius: 5px;
      padding: 0.25rem 0.6rem; cursor: pointer;
      font-size: 0.75rem; font-family: inherit;
    }
    .retry-btn:hover { background: #b91c1c; }

    /* ── Input area ── */
    .input-area {
      background: white;
      border-top: 1px solid #e5e7f0;
      padding: 0.6rem 0.75rem 0.4rem;
      flex-shrink: 0;
    }

    .input-wrap {
      display: flex;
      align-items: flex-end;
      gap: 0.4rem;
      background: #f1f5f9;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.4rem 0.4rem 0.4rem 0.75rem;
      transition: border-color 0.2s;
    }
    .input-wrap:focus-within { border-color: #00d9ff; }

    .chat-input {
      flex: 1;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.87rem;
      color: #1e293b;
      resize: none;
      outline: none;
      line-height: 1.5;
      max-height: 100px;
      overflow-y: auto;
    }
    .chat-input::placeholder { color: #94a3b8; }
    .chat-input:disabled { opacity: 0.6; }

    .send-btn {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #00d9ff, #0099ff);
      border: none; border-radius: 8px;
      color: white; font-size: 1rem;
      cursor: pointer; flex-shrink: 0;
      transition: all 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .send-btn:hover:not(:disabled) {
      transform: scale(1.08);
      box-shadow: 0 3px 10px rgba(0,153,255,0.35);
    }
    .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .spin { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .input-hint {
      font-size: 0.66rem; color: #94a3b8;
      margin: 0.25rem 0 0; text-align: center;
    }
  `]
})
export class ForumChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  loading = false;
  error = '';
  suggestedQuestions = SUGGESTED_QUESTIONS;
  private lastUserMessage = '';

  // Forum Service AI endpoint (via Gateway on port 8080, or direct on 8082)
  private readonly API_URL = 'http://localhost:8082/api/ai/chat';

  togglePanel() {
    this.isOpen = !this.isOpen;
  }

  pasteQuestion(text: string) {
    this.userInput = text;
    setTimeout(() => {
      const ta = document.querySelector('.chat-input') as HTMLTextAreaElement;
      if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }, 0);
  }

  onEnter(event: KeyboardEvent) {
    if (event.shiftKey) return;
    event.preventDefault();
    this.sendMessage();
  }

  autoResize(event: Event) {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  }

  async sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.loading) return;

    this.lastUserMessage = text;
    this.error = '';
    this.userInput = '';
    this.resetTextareaHeight();

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.loading = true;
    this.scrollToBottom();

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      this.messages.push({
        role: 'assistant',
        content: data.reply ?? 'Sorry, I could not generate a response.',
        timestamp: new Date()
      });
    } catch (err: any) {
      this.error = 'Could not reach AI service. Please try again.';
    } finally {
      this.loading = false;
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  retry() {
    this.error = '';
    this.userInput = this.lastUserMessage;
  }

  clearChat() {
    if (this.messages.length === 0) return;
    if (confirm('Clear the entire conversation?')) {
      this.messages = [];
      this.error = '';
    }
  }

  formatMessage(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom() {
    const area = document.querySelector('.messages-area');
    if (area) area.scrollTop = area.scrollHeight;
  }

  private resetTextareaHeight() {
    const ta = document.querySelector('.chat-input') as HTMLTextAreaElement;
    if (ta) ta.style.height = 'auto';
  }
}