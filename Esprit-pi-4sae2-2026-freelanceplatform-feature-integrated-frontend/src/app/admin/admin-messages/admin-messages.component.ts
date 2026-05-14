import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagePlatformService } from '../../front/upwork/services/message-platform.service';
import { Message, MessageAudit, UserBlockDto, UserDto } from '../../front/upwork/models/communication';
import { AuthService } from '../../front/services/auth.service';

type AdminTab = 'messages' | 'analytics' | 'blocked' | 'audit';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-messages.component.html',
  styleUrls: ['./admin-messages.component.scss'],
})
export class AdminMessagesComponent implements OnInit, OnDestroy {
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

  analytics: Record<string, number | undefined> = {};
  blocks: UserBlockDto[] = [];
  audits: MessageAudit[] = [];
  private barChart: { destroy: () => void; render: () => Promise<void> } | null = null;
  private donutChart: { destroy: () => void; render: () => Promise<void> } | null = null;

  constructor(
    private readonly messageService: MessagePlatformService,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

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

  private async renderCharts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const ApexCharts = (await import('apexcharts')).default;
      const total = this.analytics['totalMessages'] ?? 0;
      const ephemeral = this.analytics['ephemeralMessages'] ?? 0;
      const scheduled = this.analytics['scheduledMessages'] ?? 0;
      const replies = this.analytics['replyMessages'] ?? 0;
      const attachments = this.analytics['messagesWithAttachments'] ?? 0;
      const reactions = this.analytics['totalReactions'] ?? 0;
      const blocks = this.analytics['totalBlocks'] ?? 0;

      const barEl = document.querySelector('#admin-messages-bar-chart');
      if (barEl) {
        this.barChart?.destroy();
        this.barChart = new ApexCharts(barEl, {
          series: [
            {
              name: 'Count',
              data: [total, ephemeral, scheduled, replies, attachments, reactions, blocks],
            },
          ],
          chart: { type: 'bar', height: 280, toolbar: { show: false } },
          colors: ['#3b82f6'],
          plotOptions: { bar: { borderRadius: 6, columnWidth: '60%' } },
          dataLabels: { enabled: false },
          xaxis: {
            categories: ['Total', 'Ephemeral', 'Scheduled', 'Replies', 'Attachments', 'Reactions', 'Blocks'],
            labels: { style: { colors: '#6b7280', fontSize: '12px' } },
          },
          yaxis: { labels: { style: { colors: '#6b7280' } } },
          grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
        });
        this.barChart.render();
      }

      const donutEl = document.querySelector('#admin-messages-donut-chart');
      if (donutEl) {
        this.donutChart?.destroy();
        const standard = Math.max(0, total - ephemeral - scheduled);
        const donutSeries = [standard, ephemeral, scheduled, attachments, replies, reactions, blocks];
        const sum = donutSeries.reduce((a, b) => a + b, 0);
        this.donutChart = new ApexCharts(donutEl, {
          series: sum > 0 ? donutSeries : [1],
          chart: { type: 'donut', height: 280 },
          labels: sum > 0
            ? ['Standard', 'Ephemeral', 'Scheduled', 'Attachments', 'Replies', 'Reactions', 'Blocks']
            : ['No data'],
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'],
          legend: { position: 'bottom', fontSize: '12px' },
          plotOptions: { pie: { donut: { size: '60%' } } },
        });
        this.donutChart.render();
      }
    } catch (e) {
      console.error('Chart render error:', e);
    }
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.donutChart?.destroy();
  }

  loadUsers(): void {
    const me = this.authService.getCurrentUser();
    this.authService.getAllUsersAdmin().subscribe({
      next: (list) => {
        this.users = (list ?? [])
          .filter((u) => u?.id != null && u.id !== me?.id)
          .map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          } as UserDto));
      },
    });
  }

  loadMessages(): void {
    this.loading = true;
    const params: { date?: string; status?: string; sortOrder?: 'recent' | 'oldest'; search?: string } = {
      sortOrder: this.filterSortOrder,
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
      },
    });
  }

  loadAnalytics(): void {
    this.messageService.getAdminAnalytics().subscribe({
      next: (a) => {
        this.analytics = a;
        if (this.activeTab === 'analytics' && isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.renderCharts(), 100);
        }
      },
    });
  }

  loadBlocks(): void {
    this.messageService.getAdminBlocks().subscribe({
      next: (b) => {
        this.blocks = b;
      },
    });
  }

  loadAudits(): void {
    this.messageService.getAllAudits(100).subscribe({
      next: (a) => {
        this.audits = a;
      },
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
      minute: '2-digit',
    });
  }

  getMessageBadges(m: Message): string[] {
    const badges: string[] = [];
    if (m.ephemeralSeconds && m.ephemeralSeconds > 0) {
      const s = m.ephemeralSeconds;
      badges.push(
        s >= 86400
          ? `⏱ ${Math.floor(s / 86400)}d`
          : s >= 3600
            ? `⏱ ${Math.floor(s / 3600)}h`
            : s >= 60
              ? `⏱ ${Math.floor(s / 60)}m`
              : `⏱ ${s}s`,
      );
    } else if (m.ephemeralMinutes && m.ephemeralMinutes > 0) {
      badges.push(`⏱ ${m.ephemeralMinutes}m`);
    }
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
      },
    });
  }

  deleteMessage(m: Message): void {
    if (!confirm(`Delete message #${m.id}?`)) return;
    this.messageService.deleteMessage(m.id).subscribe({
      next: () => {
        this.rawMessages = this.rawMessages.filter((x) => x.id !== m.id);
        this.showAlert('Message deleted', 'success');
      },
      error: () => {
        this.showAlert('Error deleting message', 'error');
      },
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
