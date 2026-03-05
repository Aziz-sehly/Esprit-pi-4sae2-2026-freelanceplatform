import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../front/services/message.service';
import { Message, UserDto, MessageAudit, UserBlockDto } from '../../front/models/communication';

type AdminTab = 'messages' | 'analytics' | 'blocked' | 'audit';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-messages.component.html',
  styleUrls: ['./admin-messages.component.scss']
})
export class AdminMessagesComponent implements OnInit {
  loading = true;
  activeTab: AdminTab = 'messages';

  rawMessages: Message[] = [];
  users: UserDto[] = [];
  filterSearch = '';
  filterDate = '';
  filterStatus = '';
  filterSortOrder: 'recent' | 'oldest' = 'recent';
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  editingMessage: Message | null = null;
  editingContent = '';
  updating = false;

  analytics: Record<string, number> = {};
  blocks: UserBlockDto[] = [];
  audits: MessageAudit[] = [];

  constructor(private readonly messageService: MessageService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadMessages();
    this.loadAnalytics();
    this.loadBlocks();
    this.loadAudits();
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'analytics') this.loadAnalytics();
    if (tab === 'blocked') this.loadBlocks();
    if (tab === 'audit') this.loadAudits();
  }

  loadUsers(): void {
    this.messageService.getUsers(-1).subscribe({
      next: (u) => (this.users = u)
    });
  }

  loadMessages(): void {
    this.loading = true;
    const params: { date?: string; status?: string; sortOrder?: 'recent' | 'oldest'; search?: string } = {
      sortOrder: this.filterSortOrder
    };
    if (this.filterDate) params.date = this.filterDate;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterSearch?.trim()) params.search = this.filterSearch.trim();

    this.messageService.listAdmin(params).subscribe({
      next: (msgs) => {
        this.rawMessages = msgs;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error loading messages', 'error');
        this.loading = false;
      }
    });
  }

  loadAnalytics(): void {
    this.messageService.getAdminAnalytics().subscribe({
      next: (a) => (this.analytics = a)
    });
  }

  loadBlocks(): void {
    this.messageService.getAdminBlocks().subscribe({
      next: (b) => (this.blocks = b)
    });
  }

  loadAudits(): void {
    this.messageService.getAllAudits(100).subscribe({
      next: (a) => (this.audits = a)
    });
  }

  clearDate(): void {
    this.filterDate = '';
    this.loadMessages();
  }

  get messages(): Message[] {
    let list = this.rawMessages;

    if (this.filterDate) {
      const filterDateStr = this.filterDate;
      list = list.filter((m) => {
        if (!m.sentAt) return false;
        const msgDate = m.sentAt.slice(0, 10);
        return msgDate === filterDateStr;
      });
    }

    const q = this.filterSearch?.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const contentMatch = m.content?.toLowerCase().includes(q) ?? false;
        const senderName = this.getUserDisplayName(m.senderUserId).toLowerCase();
        const receiverName = this.getUserDisplayName(m.receiverUserId).toLowerCase();
        const nameMatch = senderName.includes(q) || receiverName.includes(q);
        return contentMatch || nameMatch;
      });
    }

    return list;
  }

  getUserDisplayName(userId: number): string {
    const u = this.users.find((x) => x.id === userId);
    if (!u) return `User ${userId}`;
    if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (u.username) return u.username;
    if (u.email) return u.email;
    return `User ${userId}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMessageBadges(m: Message): string[] {
    const badges: string[] = [];
    if (m.ephemeralSeconds && m.ephemeralSeconds > 0) {
      const s = m.ephemeralSeconds;
      badges.push(s >= 86400 ? `⏱ ${Math.floor(s / 86400)}d` : s >= 3600 ? `⏱ ${Math.floor(s / 3600)}h` : s >= 60 ? `⏱ ${Math.floor(s / 60)}m` : `⏱ ${s}s`);
    } else if (m.ephemeralMinutes && m.ephemeralMinutes > 0) badges.push(`⏱ ${m.ephemeralMinutes}m`);
    if (m.scheduledAt) badges.push('📅');
    if (m.parentId) badges.push('↩');
    if (m.threadId) badges.push('🧵');
    if (m.attachmentUrl) badges.push('📎');
    return badges;
  }

  startEdit(m: Message): void {
    this.editingMessage = m;
    this.editingContent = m.content || '';
  }

  cancelEdit(): void {
    this.editingMessage = null;
    this.editingContent = '';
  }

  saveEdit(): void {
    const m = this.editingMessage;
    if (!m || !this.editingContent?.trim()) return;
    this.updating = true;
    this.messageService.adminUpdateMessage(m.id, this.editingContent.trim()).subscribe({
      next: (updated) => {
        this.rawMessages = this.rawMessages.map((x) => (x.id === m.id ? updated : x));
        this.cancelEdit();
        this.updating = false;
        this.showAlert('Message updated', 'success');
      },
      error: () => {
        this.showAlert('Error updating message', 'error');
        this.updating = false;
      }
    });
  }

  deleteMessage(m: Message): void {
    if (!confirm(`Delete message #${m.id}?`)) return;
    this.messageService.deleteMessage(m.id).subscribe({
      next: () => {
        this.rawMessages = this.rawMessages.filter((x) => x.id !== m.id);
        this.showAlert('Message deleted', 'success');
      },
      error: () => this.showAlert('Error deleting message', 'error')
    });
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = null;
      this.alertType = null;
    }, 3000);
  }
}
