import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatMessageResponse, MessageSenderRole, TypingEvent } from '../../../models/chat.model';
import { ContractChatService } from '../../../services/contract-chat.service';

interface ChatTimelineItem {
  kind: 'day' | 'message';
  label?: string;
  message?: ChatMessageResponse;
}

@Component({
  selector: 'app-contract-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './contract-chat.component.html',
  styleUrls: ['./contract-chat.component.scss'],
})
export class ContractChatComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input({ required: true }) contractId!: number;
  @Input({ required: true }) senderId!: number;
  @Input({ required: true }) senderRole!: MessageSenderRole;
  @Input({ required: true }) senderName!: string;
  @Input() receiverName = 'Participant';
  @Input() accentClass: 'client' | 'freelancer' = 'client';

  @ViewChild('messagesViewport') private readonly messagesViewport?: ElementRef<HTMLDivElement>;
  @ViewChild('composerInput') private readonly composerInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  open = false;
  loading = false;
  linkComposerOpen = false;
  typingEvent: TypingEvent | null = null;
  messages: ChatMessageResponse[] = [];
  timelineItems: ChatTimelineItem[] = [];
  unreadCount = 0;
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;
  previewImageAlt = 'Chat image preview';

  readonly messageForm = this.fb.group({
    content: ['', [Validators.maxLength(1200)]],
  });

  readonly linkForm = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(160)]],
    url: ['', [Validators.required, Validators.maxLength(2048)]],
  });

  private readonly destroy$ = new Subject<void>();
  private readonly typing$ = new Subject<void>();
  private shouldScroll = false;
  private activeTypingTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageId: number | null = null;
  private ignoreNextMessageBatch = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly chatService: ContractChatService
  ) {
    this.typing$.pipe(debounceTime(900), takeUntil(this.destroy$)).subscribe(() => {
      this.chatService.publishTyping({
        contractId: this.contractId,
        senderId: this.senderId,
        senderRole: this.senderRole,
        senderName: this.senderName,
        typing: false,
      });
    });
  }

  ngOnInit(): void {
    this.chatService.messages$.pipe(takeUntil(this.destroy$)).subscribe((messages) => {
      const previousLastMessageId = this.lastMessageId;
      this.messages = messages;
      this.timelineItems = this.buildTimeline(messages);
      this.shouldScroll = true;
      const latestMessage = messages.at(-1);
      this.lastMessageId = latestMessage?.id ?? null;

      if (this.ignoreNextMessageBatch) {
        this.ignoreNextMessageBatch = false;
        return;
      }

      if (!latestMessage || latestMessage.id === previousLastMessageId || latestMessage.senderId === this.senderId) {
        return;
      }

      if (this.open) {
        this.playReceiveSound();
        return;
      }

      this.unreadCount += 1;
      this.playReceiveSound();
    });

    this.chatService.typing$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      this.typingEvent = event && event.senderId !== this.senderId ? event : null;
      if (this.activeTypingTimer) {
        clearTimeout(this.activeTypingTimer);
      }
      if (this.typingEvent) {
        this.activeTypingTimer = setTimeout(() => {
          this.typingEvent = null;
        }, 1600);
      }
    });

    this.messageForm.controls.content.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.open) {
        return;
      }
      this.chatService.publishTyping({
        contractId: this.contractId,
        senderId: this.senderId,
        senderRole: this.senderRole,
        senderName: this.senderName,
        typing: true,
      });
      this.typing$.next();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] && this.contractId) {
      this.lastMessageId = null;
      this.unreadCount = 0;
      this.ignoreNextMessageBatch = true;
      this.chatService.connect(this.contractId);
      this.chatService.loadHistory(this.contractId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messagesViewport) {
      this.messagesViewport.nativeElement.scrollTop = this.messagesViewport.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && this.contractId) {
      this.unreadCount = 0;
      this.ignoreNextMessageBatch = true;
      this.chatService.connect(this.contractId);
      this.chatService.loadHistory(this.contractId);
      this.shouldScroll = true;
      queueMicrotask(() => this.composerInput?.nativeElement.focus());
    }
  }

  sendText(): void {
    if (!this.contractId) {
      return;
    }

    const content = (this.messageForm.controls.content.value ?? '').trim();
    if (!content) {
      this.messageForm.controls.content.markAsTouched();
      return;
    }

    this.loading = true;
    this.chatService.send(this.contractId, {
      senderId: this.senderId,
      senderRole: this.senderRole,
      senderName: this.senderName,
      content,
    }).subscribe({
      next: () => this.handleSendSuccess(),
      error: () => {
        this.loading = false;
      },
    });
  }

  sendLink(): void {
    if (!this.contractId || this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const message = (this.messageForm.controls.content.value ?? '').trim();
    const value = this.linkForm.getRawValue();
    this.chatService.sendLink(this.contractId, {
      senderId: this.senderId,
      senderRole: this.senderRole,
      senderName: this.senderName,
      content: message || null,
      label: value.label!.trim(),
      url: value.url!.trim(),
    }).subscribe({
      next: () => this.handleSendSuccess(),
      error: () => {
        this.loading = false;
      },
    });
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openImagePreview(url: string, alt: string): void {
    this.previewImageUrl = url;
    this.previewImageAlt = alt;
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
  }

  sendFile(): void {
    if (!this.contractId || !this.selectedFile) {
      return;
    }

    this.loading = true;
    const content = (this.messageForm.controls.content.value ?? '').trim();
    this.chatService.sendFile(
      this.contractId,
      this.senderId,
      this.senderRole,
      this.senderName,
      this.selectedFile,
      this.selectedFile.name,
      content
    ).subscribe({
      next: () => this.handleSendSuccess(),
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleLinkComposer(): void {
    this.linkComposerOpen = !this.linkComposerOpen;
    if (!this.linkComposerOpen) {
      this.linkForm.reset({ label: '', url: '' });
    }
  }

  trackById(index: number, item: ChatTimelineItem): string | number {
    if (item.kind === 'day') {
      return `day-${item.label ?? index}`;
    }

    return item.message?.id ?? index;
  }

  isMine(message: ChatMessageResponse): boolean {
    return message.senderId === this.senderId;
  }

  isDayItem(item: ChatTimelineItem): boolean {
    return item.kind === 'day';
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.sendText();
  }

  attachmentUrl(message: ChatMessageResponse): string | null {
    if (message.attachmentType === 'FILE' && message.attachmentDownloadUrl) {
      return `${environment.apiGateway}${message.attachmentDownloadUrl}`;
    }

    if (message.attachmentType === 'LINK') {
      return message.attachmentUrl;
    }

    return null;
  }

  isImageAttachment(message: ChatMessageResponse): boolean {
    return message.attachmentType === 'FILE' && !!message.attachmentMimeType?.startsWith('image/');
  }

  attachmentIcon(message: ChatMessageResponse): string {
    if (message.attachmentType === 'LINK') {
      if ((message.attachmentUrl ?? '').includes('github.com')) return 'code';
      if ((message.attachmentUrl ?? '').includes('figma.com')) return 'design_services';
      return 'link';
    }

    if (message.attachmentMimeType?.includes('pdf')) return 'picture_as_pdf';
    if (message.attachmentMimeType?.includes('zip')) return 'folder_zip';
    if (message.attachmentMimeType?.includes('image')) return 'image';
    return 'attach_file';
  }

  prettyFileSize(bytes: number | null): string {
    if (!bytes) {
      return '';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  }

  ngOnDestroy(): void {
    if (this.activeTypingTimer) {
      clearTimeout(this.activeTypingTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
  }

  private handleSendSuccess(): void {
    this.loading = false;
    this.messageForm.reset({ content: '' });
    this.clearSelectedFile();
    this.linkForm.reset({ label: '', url: '' });
    this.linkComposerOpen = false;
    this.chatService.publishTyping({
      contractId: this.contractId,
      senderId: this.senderId,
      senderRole: this.senderRole,
      senderName: this.senderName,
      typing: false,
    });
    queueMicrotask(() => this.composerInput?.nativeElement.focus());
  }

  private buildTimeline(messages: ChatMessageResponse[]): ChatTimelineItem[] {
    const items: ChatTimelineItem[] = [];
    let currentDay = '';

    for (const message of messages) {
      const label = this.formatDayLabel(message.sentAt);
      if (label !== currentDay) {
        currentDay = label;
        items.push({ kind: 'day', label });
      }
      items.push({ kind: 'message', message });
    }

    return items;
  }

  private formatDayLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    }).format(date);
  }

  private playReceiveSound(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startTime = context.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(540, startTime);
    oscillator.frequency.linearRampToValueAtTime(880, startTime + 0.12);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.25);
  }
}
