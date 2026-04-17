import { Component, OnInit, OnDestroy, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MessagePlatformService } from '../../services/message-platform.service';
import { AuthService } from '../../../services/auth.service';
import { MessagePlatformWsService } from '../../services/message-platform-ws.service';
import { Contract, ContractService } from '../../../services/Contract.service';
import { MilestoneService } from '../../services/milestone.service';
import { MilestoneResponse } from '../../models/milestone.model';
import { Message, MessageRequest, ConversationDto, UserDto, ReactionDto } from '../../models/communication';

@Component({
  selector: 'app-messages-platform',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-platform.component.html',
  styleUrls: ['./messages-platform.component.scss']
})
export class MessagesPlatformComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessagePlatformService);
  private readonly authService = inject(AuthService);
  private readonly wsService = inject(MessagePlatformWsService);
  private readonly contractService = inject(ContractService);
  private readonly milestoneService = inject(MilestoneService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  replyToMessage: Message | null = null;
  messageReactions: Record<number, ReactionDto[]> = {};
  typingUserId: number | null = null;
  /** Map: userId -> 'online' | 'offline' */
  userStatusMap: Record<number, string> = {};
  messageType: 'standard' | 'ephemeral' | 'scheduled' = 'standard';
  ephemeralDays = 0;
  ephemeralHours = 0;
  ephemeralMinutes = 0;
  ephemeralSeconds = 0;
  scheduledAt = '';
  searchInMessages = '';
  blockedUserIds: number[] = [];
  /** True when the other user has blocked us - we can't send messages */
  blockedByThem = false;
  users: UserDto[] = [];
  /** Contrats où l’utilisateur courant est client ou freelance (pour contacts + jalons). */
  myContracts: Contract[] = [];
  /** Contrats avec au moins un jalon, entre moi et l’interlocuteur sélectionné. */
  partnerMilestones: { contract: Contract; milestones: MilestoneResponse[] }[] = [];
  conversations: ConversationDto[] = [];
  messages: Message[] = [];
  selectedConversation: ConversationDto | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  newMessageContent = '';
  attachmentUrl = '';
  attachmentFileName = '';
  attachmentUrls: { url: string; fileName: string }[] = [];
  sending = false;
  uploading = false;
  userSearch = '';

  editingMessageId: number | null = null;
  editingContent = '';
  updating = false;

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_INTERVAL_MS = 5000;
  private readonly STORAGE_KEY = 'prolance-selected-conversation';

  /** contractId = 0 pour les conversations directes (sans contrat) */
  readonly DIRECT_CONTRACT_ID = 0;

  /** Available reaction emojis (Slack-style) */
  readonly REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'] as const;
  reactionPickerMessageId: number | null = null;
  /** Expanded thread/replies: messageId -> replies */
  threadReplies: Record<number, Message[]> = {};
  expandedThreadIds = new Set<number>();
  /** Tags for current conversation */
  conversationTags: { id: number; tagName: string; color?: string }[] = [];
  newTagName = '';
  translatingMessageId: number | null = null;
  translatedContent: Record<number, string> = {};
  isOnline = navigator.onLine;
  recording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];

  get currentUserId(): number | null {
    return this.authService.getNumericUserId();
  }

  get filteredUsers(): UserDto[] {
    let list = this.users.filter((u) => !this.blockedUserIds.includes(u.id));
    if (!this.userSearch.trim()) return list;
    const q = this.userSearch.trim().toLowerCase();
    return list.filter((u) =>
      String(u.id).includes(q) ||
      (u.username?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.firstName?.toLowerCase().includes(q)) ||
      (u.lastName?.toLowerCase().includes(q))
    );
  }

  /** Blocked users with display info (from users list or fallback to id) */
  get blockedUsers(): { id: number; displayName: string }[] {
    return this.blockedUserIds.map((id) => {
      const u = this.users.find((x) => x.id === id);
      return { id, displayName: u ? this.getUserDisplayName(u) : `User ${id}` };
    });
  }

  getSelectedUserDisplayName(): string {
    const conv = this.selectedConversation;
    if (!conv) return '';
    return this.getConvUserDisplayName(conv);
  }

  getConvUserDisplayName(conv: ConversationDto): string {
    const u = this.users.find((x) => x.id === conv.otherUserId);
    return u ? this.getUserDisplayName(u) : `User ${conv.otherUserId}`;
  }

  getUserDisplayName(u: UserDto): string {
    if (u.firstName || u.lastName) {
      return [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    }
    if (u.username) return u.username;
    if (u.email) return u.email;
    return `User ${u.id}`;
  }

  ngOnInit(): void {
    const uid = this.currentUserId;
    if (uid != null) (window as any).__prolanceUserId = uid;
    this.wsService.connect();
    this.wsService.newMessage$.subscribe((e) => {
      if (this.selectedConversation && e.message) {
        const m = e.message as Message;
        if ((m.senderUserId === this.selectedConversation.otherUserId || m.receiverUserId === this.selectedConversation.otherUserId) &&
            m.contractId === this.selectedConversation.contractId) {
          if (!this.messages.find(x => x.id === m.id)) {
            this.messages = [...this.messages, m].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          }
        }
      }
    });
    this.wsService.typing$.subscribe((e) => {
      if (this.selectedConversation?.otherUserId === e.userId) this.typingUserId = e.userId;
      setTimeout(() => this.typingUserId = null, 3000);
    });
    this.wsService.presence$.subscribe((e) => {
      this.userStatusMap = { ...this.userStatusMap, [e.userId]: e.status };
    });
    window.addEventListener('online', () => { this.isOnline = true; this.flushOfflineQueue(); });
    window.addEventListener('offline', () => { this.isOnline = false; });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.revokeAttachmentBlobUrls();
    const uid = this.currentUserId;
    if (uid != null) this.wsService.sendPresence(uid, 'offline');
    this.wsService.disconnect();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.reactionPickerMessageId = null;
  }

  loadData(): void {
    const uid = this.currentUserId;
    if (uid == null) {
      this.loading = false;
      this.showAlert('Connectez-vous pour accéder à vos messages', 'error');
      return;
    }
    this.loading = true;
    this.loadContractPartnersAsUsers(uid, () => {
      this.messageService.getBlockedUsers(uid).pipe(catchError(() => of([] as number[]))).subscribe((ids) => (this.blockedUserIds = ids || []));
      this.messageService.getConversations(uid).pipe(catchError(() => of([] as ConversationDto[]))).subscribe({
        next: (conv) => {
          this.conversations = conv ?? [];
          this.restoreSelectedConversation();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
        },
      });
    });
  }

  /**
   * Charge les contrats du user (client + freelance), déduit les IDs des contreparties,
   * puis récupère leurs profils depuis le user-service.
   * Remplace complètement le message-service/users (qui renvoyait des faux IDs démo).
   */
  private loadContractPartnersAsUsers(uid: number, done: () => void): void {
    const me = this.authService.getCurrentUser();
    if (!me?.id) {
      this.myContracts = [];
      this.users = [];
      done();
      return;
    }

    this.contractService.getAllForUser(me.id).subscribe((contracts) => {
      this.myContracts = contracts ?? [];
      this.myContracts.forEach(c => this.contractService.enrichForDisplay(c));
      const otherIds = new Set<number>();
      for (const c of this.myContracts) {
        const oid = c.clientId === me.id ? c.freelancerId : c.clientId;
        if (oid != null && oid !== me.id) otherIds.add(oid);
      }

      if (otherIds.size === 0) {
        this.users = [];
        done();
        return;
      }

      forkJoin([...otherIds].map((id) => this.authService.getPublicUser(id))).subscribe({
        next: (profiles) => {
          this.users = profiles
            .filter((p) => p?.id != null)
            .map((p) => ({
              id: p.id,
              email: p.email,
              firstName: p.firstName,
              lastName: p.lastName,
            }));
          if (this.selectedConversation) this.refreshPartnerMilestones();
          done();
        },
        error: () => {
          this.users = [...otherIds].map((id) => ({ id } as UserDto));
          done();
        },
      });
    });
  }

  /** Jalons des contrats en commun avec l’interlocuteur (affichage latéral). */
  private refreshPartnerMilestones(): void {
    const conv = this.selectedConversation;
    const me = this.authService.getCurrentUser();
    if (!conv || !me?.id) {
      this.partnerMilestones = [];
      return;
    }
    const shared = this.myContracts.filter(
      (c) =>
        (c.clientId === me.id && c.freelancerId === conv.otherUserId) ||
        (c.freelancerId === me.id && c.clientId === conv.otherUserId),
    );
    if (shared.length === 0) {
      this.partnerMilestones = [];
      this.cdr.markForCheck();
      return;
    }
    forkJoin(
      shared.map((c) =>
        this.milestoneService.listByContractId(c.id).pipe(
          catchError(() => of([] as MilestoneResponse[])),
          map((ms) => ({ contract: c, milestones: ms ?? [] })),
        ),
      ),
    ).subscribe((rows) => {
      this.partnerMilestones = rows.filter((r) => r.milestones.length > 0);
      this.cdr.markForCheck();
    });
  }

  selectUser(user: UserDto): void {
    this.revokeAttachmentBlobUrls();
    this.wsService.subscribeToPresence(user.id);
    const existing = this.conversations.find(
      (c) => c.otherUserId === user.id && c.contractId === this.DIRECT_CONTRACT_ID
    );
    if (existing) {
      this.selectConversation(existing);
    } else {
      this.selectedConversation = {
        contractId: this.DIRECT_CONTRACT_ID,
        otherUserId: user.id,
        unreadCount: 0
      };
      this.saveSelectedConversation();
      this.checkBlockedByThem();
      this.loadMessages();
      this.startPolling();
      this.loadConversationTags();
      this.refreshPartnerMilestones();
      const uid = this.currentUserId;
      if (uid) {
        this.wsService.subscribeToConversation(this.DIRECT_CONTRACT_ID, uid, user.id);
        this.wsService.subscribeToPresence(user.id);
      }
    }
  }

  selectConversation(conv: ConversationDto): void {
    const uid = this.currentUserId;
    if (uid && this.blockedUserIds.includes(conv.otherUserId)) {
      this.showAlert('This user is blocked', 'error');
      return;
    }
    this.revokeAttachmentBlobUrls();
    this.selectedConversation = conv;
    this.saveSelectedConversation();
    this.checkBlockedByThem();
    this.loadMessages();
    this.startPolling();
    this.loadConversationTags();
    this.refreshPartnerMilestones();
    if (uid) {
      this.wsService.subscribeToConversation(conv.contractId, uid, conv.otherUserId);
      this.wsService.subscribeToPresence(conv.otherUserId);
    }
  }

  getOtherUserStatus(): string {
    const conv = this.selectedConversation;
    if (!conv) return 'offline';
    return this.userStatusMap[conv.otherUserId] || 'offline';
  }

  private checkBlockedByThem(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || !uid || this.blockedUserIds.includes(conv.otherUserId)) {
      this.blockedByThem = false;
      return;
    }
    this.messageService.isBlocked(uid, conv.otherUserId).subscribe({
      next: (blocked) => {
        this.blockedByThem = blocked;
      },
      error: () => (this.blockedByThem = false)
    });
  }

  loadMessages(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || uid == null) return;

    this.messageService.listConversation(conv.contractId, uid, conv.otherUserId).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        msgs.forEach((m) => {
          if (m.receiverUserId === uid && m.status === 'SENT') {
            this.messageService.markAsRead(m.id).subscribe();
          }
          this.messageService.getReactions(m.id).subscribe(rs => {
            this.messageReactions = { ...this.messageReactions, [m.id]: rs };
          });
          this.loadAttachmentPreview(m);
        });
      },
      error: () => this.showAlert('Error loading messages', 'error')
    });
  }

  get messagesFiltered(): Message[] {
    if (!this.searchInMessages?.trim()) return this.messages;
    const q = this.searchInMessages.trim().toLowerCase();
    return this.messages.filter(m => (m.content || '').toLowerCase().includes(q));
  }

  sendTyping(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || uid == null) return;
    this.wsService.sendTyping(conv.contractId, uid, conv.otherUserId);
  }

  setReplyTo(m: Message | null): void {
    this.replyToMessage = m;
  }

  getParentMessage(m: Message): Message | undefined {
    if (!m.parentId) return undefined;
    return this.messages.find((x) => x.id === m.parentId);
  }

  toggleThread(m: Message): void {
    if (this.expandedThreadIds.has(m.id)) {
      this.expandedThreadIds.delete(m.id);
      return;
    }
    this.expandedThreadIds.add(m.id);
    this.messageService.getReplies(m.id).subscribe(replies => {
      this.threadReplies = { ...this.threadReplies, [m.id]: replies };
    });
  }

  getThreadReplies(m: Message): Message[] {
    return this.threadReplies[m.id] || [];
  }

  hasReplies(m: Message): boolean {
    return (m as any).replyCount > 0 || (this.threadReplies[m.id]?.length ?? 0) > 0;
  }

  loadConversationTags(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || uid == null) return;
    this.messageService.getTags(conv.contractId, uid, conv.otherUserId).subscribe(tags => {
      this.conversationTags = tags;
    });
  }

  addTag(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || !uid || !this.newTagName.trim()) return;
    this.messageService.addTag(conv.contractId, uid, conv.otherUserId, this.newTagName.trim()).subscribe({
      next: (tag) => {
        this.conversationTags = [...this.conversationTags, tag];
        this.newTagName = '';
      },
      error: () => this.showAlert('Error adding tag', 'error')
    });
  }

  removeTag(tagId: number): void {
    this.messageService.removeTag(tagId).subscribe({
      next: () => this.conversationTags = this.conversationTags.filter(t => t.id !== tagId)
    });
  }

  translateMessage(m: Message, toLang: 'en' | 'fr' = 'en'): void {
    if (!m.content?.trim()) return;
    this.translatingMessageId = m.id;
    this.messageService.translate(m.content, 'auto', toLang).subscribe({
      next: (res) => {
        this.translatedContent = { ...this.translatedContent, [m.id]: res.translated };
        this.translatingMessageId = null;
      },
      error: () => {
        this.showAlert('Translation failed', 'error');
        this.translatingMessageId = null;
      }
    });
  }

  clearTranslation(m: Message): void {
    const next = { ...this.translatedContent };
    delete next[m.id];
    this.translatedContent = next;
  }

  getTranslatedContent(m: Message): string | null {
    return this.translatedContent[m.id] ?? null;
  }

  isImageAttachment(url?: string, fileName?: string): boolean {
    const ext = (fileName || url || '').toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(ext) || /\.(jpg|jpeg|png|gif|webp)/.test(url || '');
  }

  isAudioAttachment(url?: string, fileName?: string): boolean {
    const ext = (fileName || url || '').toLowerCase();
    return /\.(webm|mp3|ogg|wav|m4a)$/i.test(ext);
  }

  /** Cache blob URLs for authenticated attachment preview (évite 401) */
  attachmentBlobUrls: Record<string, string> = {};

  getAttachmentPreviewUrl(m: Message): string | null {
    if (!m.attachmentUrl || !this.isImageAttachment(m.attachmentUrl, m.attachmentFileName)) return null;
    return this.attachmentBlobUrls[m.attachmentUrl] ?? null;
  }

  getAudioPreviewUrl(m: Message): string | null {
    if (!m.attachmentUrl || !this.isAudioAttachment(m.attachmentUrl, m.attachmentFileName)) return null;
    return this.attachmentBlobUrls[m.attachmentUrl] ?? null;
  }

  /** Charge une pièce jointe via HTTP authentifié et crée une blob URL pour la preview */
  loadAttachmentPreview(m: Message): void {
    if (!m.attachmentUrl) return;
    const isPreview = this.isImageAttachment(m.attachmentUrl, m.attachmentFileName) || this.isAudioAttachment(m.attachmentUrl, m.attachmentFileName);
    if (!isPreview || this.attachmentBlobUrls[m.attachmentUrl]) return;
    this.messageService.getAttachment(m.attachmentUrl).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.attachmentBlobUrls = { ...this.attachmentBlobUrls, [m.attachmentUrl!]: url };
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private revokeAttachmentBlobUrls(): void {
    Object.values(this.attachmentBlobUrls).forEach(url => URL.revokeObjectURL(url));
    this.attachmentBlobUrls = {};
  }

  private offlineQueue: MessageRequest[] = [];
  startVoiceRecording(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.showAlert('Voice recording not supported', 'error');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordingChunks = [];
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size) this.recordingChunks.push(e.data); };
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        this.uploading = true;
        this.messageService.uploadFile(file).subscribe({
          next: (res) => {
            this.attachmentUrl = res.url;
            this.attachmentFileName = res.fileName;
            this.uploading = false;
          },
          error: () => { this.showAlert('Upload failed', 'error'); this.uploading = false; }
        });
      };
      this.mediaRecorder.start();
      this.recording = true;
    }).catch(() => this.showAlert('Microphone access denied', 'error'));
  }

  stopVoiceRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      this.recording = false;
    }
  }

  private flushOfflineQueue(): void {
    if (!this.isOnline || this.offlineQueue.length === 0) return;
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || !uid) return;
    const toSend = [...this.offlineQueue];
    this.offlineQueue = [];
    toSend.forEach(req => {
      this.messageService.create(req).subscribe({
        next: (created) => {
          this.messages = [...this.messages, created].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        }
      });
    });
  }

  isEphemeral(m: Message): boolean {
    return (m.ephemeralSeconds != null && m.ephemeralSeconds > 0) ||
           (m.ephemeralMinutes != null && m.ephemeralMinutes > 0);
  }

  isScheduled(m: Message): boolean {
    return !!(m.scheduledAt && m.scheduledAt.trim());
  }

  addReaction(m: Message, emoji: string): void {
    const uid = this.currentUserId;
    if (!uid) return;
    this.reactionPickerMessageId = null;
    this.messageService.addReaction(m.id, uid, emoji).subscribe({
      next: () => this.refreshReactions(m.id),
      error: () => this.showAlert('Failed to add reaction', 'error')
    });
  }

  removeReaction(m: Message): void {
    const uid = this.currentUserId;
    if (!uid) return;
    this.messageService.removeReaction(m.id, uid).subscribe({
      next: () => this.refreshReactions(m.id),
      error: () => this.showAlert('Failed to remove reaction', 'error')
    });
  }

  toggleReaction(m: Message, emoji: string): void {
    const uid = this.currentUserId;
    if (!uid) return;
    const reactions = this.messageReactions[m.id] || [];
    const myReaction = reactions.find(r => r.userId === uid);
    if (myReaction?.emoji === emoji) {
      this.removeReaction(m);
    } else {
      this.addReaction(m, emoji);
    }
  }

  toggleReactionPicker(m: Message | null): void {
    this.reactionPickerMessageId = this.reactionPickerMessageId === m?.id ? null : (m?.id ?? null);
  }

  getReactions(m: Message): ReactionDto[] {
    return this.messageReactions[m.id] || [];
  }

  /** Group reactions by emoji with count and user ids */
  getReactionsGrouped(m: Message): { emoji: string; count: number; userIds: number[] }[] {
    const reactions = this.getReactions(m);
    const map = new Map<string, number[]>();
    for (const r of reactions) {
      const list = map.get(r.emoji) ?? [];
      list.push(r.userId);
      map.set(r.emoji, list);
    }
    return Array.from(map.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds
    }));
  }

  hasUserReacted(m: Message, emoji: string): boolean {
    const uid = this.currentUserId;
    if (!uid) return false;
    const reactions = this.getReactions(m);
    return reactions.some(r => r.userId === uid && r.emoji === emoji);
  }

  private refreshReactions(messageId: number): void {
    this.messageService.getReactions(messageId).subscribe(rs => {
      this.messageReactions = { ...this.messageReactions, [messageId]: rs };
    });
  }

  blockUser(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    if (!conv || !uid) return;
    if (!confirm('Block this user? You will no longer see their messages.')) return;
    this.messageService.blockUser(uid, conv.otherUserId).subscribe({
      next: () => {
        this.blockedUserIds = [...this.blockedUserIds, conv.otherUserId];
        this.showAlert('User blocked', 'success');
        this.selectedConversation = null;
        this.messages = [];
        this.clearSelectedConversation();
        this.stopPolling();
        this.loadData();
      },
      error: (err) => {
        this.showAlert(err?.error?.message || err?.status === 404 ? 'Block feature unavailable' : 'Error blocking user', 'error');
      }
    });
  }

  unblockUser(blockedUserId: number): void {
    const uid = this.currentUserId;
    if (!uid) return;
    this.messageService.unblockUser(uid, blockedUserId).subscribe({
      next: () => {
        this.blockedUserIds = this.blockedUserIds.filter((id) => id !== blockedUserId);
        this.showAlert('User unblocked', 'success');
        this.loadData();
      },
      error: () => this.showAlert('Error unblocking user', 'error')
    });
  }

  sendMessage(): void {
    const conv = this.selectedConversation;
    const uid = this.currentUserId;
    const content = this.newMessageContent?.trim() || '';
    if (!conv || uid == null) return;
    if (this.blockedByThem) {
      this.showAlert("You can't send messages to this user. They have blocked you.", 'error');
      return;
    }
    if (!content && !this.attachmentUrl) {
      this.showAlert('Enter a message or attach a file', 'error');
      return;
    }

    if (!this.isOnline) {
      const req: MessageRequest = {
        contractId: conv.contractId,
        senderUserId: uid,
        receiverUserId: conv.otherUserId,
        content: content || '(attachment)'
      };
      if (this.attachmentUrl) { req.attachmentUrl = this.attachmentUrl; req.attachmentFileName = this.attachmentFileName; }
      if (this.replyToMessage) req.parentId = this.replyToMessage.id;
      this.offlineQueue.push(req);
      this.newMessageContent = '';
      this.replyToMessage = null;
      this.removeAttachment();
      this.showAlert('Message queued for when you are back online', 'success');
      return;
    }

    const req: MessageRequest = {
      contractId: conv.contractId,
      senderUserId: uid,
      receiverUserId: conv.otherUserId,
      content: content || '(attachment)'
    };
    if (this.attachmentUrl) {
      req.attachmentUrl = this.attachmentUrl;
      req.attachmentFileName = this.attachmentFileName || undefined;
    }
    if (this.replyToMessage) req.parentId = this.replyToMessage.id;
    if (this.messageType === 'ephemeral') {
      const totalEphemeralSec = this.ephemeralDays * 86400 + this.ephemeralHours * 3600 + this.ephemeralMinutes * 60 + this.ephemeralSeconds;
      if (totalEphemeralSec > 0) req.ephemeralSeconds = totalEphemeralSec;
    }
    if (this.messageType === 'scheduled' && this.scheduledAt) {
      req.scheduledAt = this.ensureScheduledWithSeconds(this.scheduledAt);
    }

    this.sending = true;
    const attachments = this.attachmentUrls.length > 0 ? this.attachmentUrls : [];
    const sendOne = (r: MessageRequest, onDone: () => void) => {
      this.messageService.create(r).subscribe({
        next: (created) => {
          this.messages = [...this.messages, created].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );
          onDone();
        },
        error: () => {
          this.showAlert('Error sending message', 'error');
          this.sending = false;
        }
      });
    };
    if (attachments.length > 0) {
      let idx = 0;
      const next = () => {
        if (idx >= attachments.length) {
          this.newMessageContent = '';
          this.attachmentUrl = '';
          this.attachmentFileName = '';
          this.attachmentUrls = [];
          this.replyToMessage = null;
          this.scheduledAt = '';
          this.messageType = 'standard';
          this.resetEphemeralFields();
          this.loadData();
          this.sending = false;
          return;
        }
        const a = attachments[idx++];
        const r: MessageRequest = { ...req, content: idx === 1 && content ? content : '(attachment)', attachmentUrl: a.url, attachmentFileName: a.fileName };
        sendOne(r, next);
      };
      next();
    } else {
      sendOne(req, () => {
        this.newMessageContent = '';
        this.attachmentUrl = '';
        this.attachmentFileName = '';
        this.attachmentUrls = [];
        this.replyToMessage = null;
        this.scheduledAt = '';
        this.resetEphemeralFields();
        this.loadData();
        this.sending = false;
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    if (files.length === 1) {
      this.uploading = true;
      this.messageService.uploadFile(files[0]).subscribe({
        next: (res) => {
          this.attachmentUrl = res.url;
          this.attachmentFileName = res.fileName;
          this.uploading = false;
          input.value = '';
        },
        error: () => {
          this.showAlert('Error uploading file', 'error');
          this.uploading = false;
        }
      });
    } else {
      this.uploading = true;
      this.messageService.uploadMultiple(Array.from(files)).subscribe({
        next: (res) => {
          this.attachmentUrls = res.map(r => ({ url: r.url, fileName: r.fileName }));
          if (this.attachmentUrls.length > 0) {
            this.attachmentUrl = this.attachmentUrls[0].url;
            this.attachmentFileName = this.attachmentUrls.map(a => a.fileName).join(', ');
          }
          this.uploading = false;
          input.value = '';
        },
        error: () => {
          this.showAlert('Error uploading files', 'error');
          this.uploading = false;
        }
      });
    }
  }

  removeAttachment(): void {
    this.attachmentUrl = '';
    this.attachmentFileName = '';
    this.attachmentUrls = [];
  }

  startEdit(m: Message): void {
    this.editingMessageId = m.id;
    this.editingContent = m.content || '';
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingContent = '';
  }

  saveEdit(): void {
    const uid = this.currentUserId;
    const id = this.editingMessageId;
    if (uid == null || id == null) return;
    const content = this.editingContent?.trim();
    if (!content) {
      this.showAlert('Message cannot be empty', 'error');
      return;
    }
    this.updating = true;
    this.messageService.updateMessage(id, uid, content).subscribe({
      next: (updated) => {
        this.messages = this.messages.map((x) => (x.id === id ? updated : x));
        this.cancelEdit();
        this.loadData();
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
    if (!confirm('Delete this message?')) return;
    this.messageService.deleteMessage(m.id).subscribe({
      next: () => {
        this.messages = this.messages.filter((x) => x.id !== m.id);
        this.showAlert('Message deleted', 'success');
      },
      error: () => this.showAlert('Error deleting message', 'error')
    });
  }

  deleteConversation(): void {
    const conv = this.selectedConversation;
    if (!conv || !confirm('Delete entire conversation?')) return;
    this.messageService.deleteConversation(conv.contractId).subscribe({
      next: () => {
        this.selectedConversation = null;
        this.messages = [];
        this.clearSelectedConversation();
        this.stopPolling();
        this.loadData();
        this.showAlert('Conversation deleted', 'success');
      },
      error: () => this.showAlert('Error deleting conversation', 'error')
    });
  }

  private resetEphemeralFields(): void {
    this.ephemeralDays = 0;
    this.ephemeralHours = 0;
    this.ephemeralMinutes = 0;
    this.ephemeralSeconds = 0;
  }

  formatEphemeral(m: Message): string {
    if (m.ephemeralSeconds && m.ephemeralSeconds > 0) {
      const s = m.ephemeralSeconds;
      if (s >= 86400) return Math.floor(s / 86400) + 'd';
      if (s >= 3600) return Math.floor(s / 3600) + 'h';
      if (s >= 60) return Math.floor(s / 60) + 'm';
      return s + 's';
    }
    if (m.ephemeralMinutes && m.ephemeralMinutes > 0) return m.ephemeralMinutes + 'm';
    return '';
  }

  /** Ensures scheduled datetime has seconds for API (datetime-local may omit them) */
  private ensureScheduledWithSeconds(s: string): string {
    if (!s?.trim()) return s;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s + ':00';
    return s;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isFromMe(m: Message): boolean {
    return m.senderUserId === this.currentUserId;
  }

  getAttachmentFullUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  }

  /** Ouvre la pièce jointe via fetch authentifié (évite l'erreur "page isn't working") */
  openAttachment(url: string | undefined): void {
    if (!url) return;
    this.messageService.getAttachment(url).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      },
      error: () => this.showAlert('Unable to open attachment', 'error')
    });
  }

  private saveSelectedConversation(): void {
    const c = this.selectedConversation;
    if (!c) return;
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({ contractId: c.contractId, otherUserId: c.otherUserId }));
    } catch {}
  }

  private clearSelectedConversation(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }

  private restoreSelectedConversation(): void {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const { contractId, otherUserId } = JSON.parse(raw);
      let conv = this.conversations.find((c) => c.contractId === contractId && c.otherUserId === otherUserId);
      if (!conv) {
        conv = { contractId, otherUserId, unreadCount: 0 };
      }
      this.selectedConversation = conv;
      const uid = this.currentUserId;
      if (uid) {
        this.wsService.subscribeToConversation(conv.contractId, uid, conv.otherUserId);
        this.wsService.subscribeToPresence(conv.otherUserId);
      }
      this.checkBlockedByThem();
      this.loadMessages();
      this.startPolling();
      this.loadConversationTags();
      this.refreshPartnerMilestones();
    } catch {}
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (this.selectedConversation) this.loadMessages();
    }, this.POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
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
