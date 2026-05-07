import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../../environments/environment';
import {
  ChatLinkMessageRequest,
  ChatMessageRequest,
  ChatMessageResponse,
  MessageSenderRole,
  TypingEvent,
} from '../models/chat.model';
import { Contract } from '../../services/Contract.service';

interface MessageApi {
  id: number;
  contractId: number;
  senderUserId: number;
  receiverUserId: number;
  content: string;
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
  sentAt: string;
  contentType?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContractChatService {
  private readonly messagesSubject = new BehaviorSubject<ChatMessageResponse[]>([]);
  private readonly typingSubject = new BehaviorSubject<TypingEvent | null>(null);

  readonly messages$ = this.messagesSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();

  private client: Client | null = null;
  private activeContractId: number | null = null;
  private activeUserId: number | null = null;
  private activeOtherUserId: number | null = null;
  private activeSelfRole: MessageSenderRole = 'CLIENT';
  private activeSelfName = '';
  private activePeerName = '';

  constructor(private readonly http: HttpClient) {}

  connect(
    contractId: number,
    userId: number,
    otherUserId: number,
    selfRole: MessageSenderRole,
    selfName: string,
    peerName: string,
  ): void {
    if (
      this.activeContractId === contractId &&
      this.activeUserId === userId &&
      this.activeOtherUserId === otherUserId &&
      this.client?.connected
    ) {
      return;
    }

    this.client?.deactivate();
    this.client = null;

    this.activeContractId = contractId;
    this.activeUserId = userId;
    this.activeOtherUserId = otherUserId;
    this.activeSelfRole = selfRole;
    this.activeSelfName = selfName;
    this.activePeerName = peerName;

    const min = Math.min(userId, otherUserId);
    const max = Math.max(userId, otherUserId);
    const topic = `/topic/conv/${contractId}/${min}/${max}`;

    this.client = new Client({
      brokerURL: environment.messageWsUrl,
      reconnectDelay: 3000,
      onConnect: () => {
        this.client?.subscribe(topic, (message) => this.onSocketMessage(message));
      },
    });
    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.activeContractId = null;
    this.activeUserId = null;
    this.activeOtherUserId = null;
    this.messagesSubject.next([]);
    this.typingSubject.next(null);
  }

  loadHistory(contractId: number, userId: number, otherUserId: number): void {
    this.history(contractId, userId, otherUserId).subscribe((messages) => this.messagesSubject.next(messages ?? []));
  }

  history(contractId: number, userId: number, otherUserId: number) {
    return this.http
      .get<MessageApi[]>(`${environment.messageApiBase}/api/messages/contracts/${contractId}/conversation`, {
        params: { userId: String(userId), otherUserId: String(otherUserId) },
      })
      .pipe(
        map((rows) =>
          (rows ?? []).map((m) =>
            this.mapMessage(m, userId, otherUserId, this.activeSelfRole, this.activeSelfName, this.activePeerName),
          ),
        ),
      );
  }

  /** Tous les messages du contrat (ex. fil d’activité). */
  listContractMessages(contract: Contract) {
    return this.http
      .get<MessageApi[]>(`${environment.messageApiBase}/api/messages/contracts/${contract.id}`)
      .pipe(map((rows) => (rows ?? []).map((m) => this.mapMessageWithContract(m, contract))));
  }

  send(contractId: number, receiverId: number, payload: ChatMessageRequest, peerName: string) {
    const body = {
      contractId,
      senderUserId: payload.senderId,
      receiverUserId: receiverId,
      content: payload.content,
    };
    return this.http.post<MessageApi>(`${environment.messageApiBase}/api/messages`, body).pipe(
      map((m) => this.mapMessage(m, payload.senderId, receiverId, payload.senderRole, payload.senderName, peerName)),
    );
  }

  sendLink(contractId: number, receiverId: number, payload: ChatLinkMessageRequest, peerName: string) {
    const content = (payload.content && payload.content.trim()) || payload.label;
    const body = {
      contractId,
      senderUserId: payload.senderId,
      receiverUserId: receiverId,
      content,
      attachmentUrl: payload.url.trim(),
      attachmentFileName: payload.label.trim(),
    };
    return this.http.post<MessageApi>(`${environment.messageApiBase}/api/messages`, body).pipe(
      map((m) => this.mapMessage(m, payload.senderId, receiverId, payload.senderRole, payload.senderName, peerName)),
    );
  }

  sendFile(
    contractId: number,
    senderId: number,
    senderRole: MessageSenderRole,
    senderName: string,
    receiverId: number,
    peerName: string,
    file: File,
    label?: string,
    content?: string,
  ) {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<{ url: string; fileName: string }>(`${environment.messageApiBase}/api/messages/upload`, form)
      .pipe(
        switchMap((res) => {
          const text = (content && content.trim()) || (label && label.trim()) || file.name;
          const body: Record<string, string | number | undefined> = {
            contractId,
            senderUserId: senderId,
            receiverUserId: receiverId,
            content: text,
            attachmentUrl: res.url,
            attachmentFileName: res.fileName || file.name,
          };
          if (file.type) {
            body['contentType'] = file.type;
          }
          return this.http.post<MessageApi>(`${environment.messageApiBase}/api/messages`, body);
        }),
        map((m) => this.mapMessage(m, senderId, receiverId, senderRole, senderName, peerName)),
      );
  }

  announceCall(
    contractId: number,
    senderId: number,
    senderRole: MessageSenderRole,
    senderName: string,
    receiverId: number,
    peerName: string,
  ) {
    const roomUrl = `https://meet.jit.si/academic-contract-${contractId}`;
    const body = {
      contractId,
      senderUserId: senderId,
      receiverUserId: receiverId,
      content: 'Started a live contract call.',
      attachmentUrl: roomUrl,
      attachmentFileName: 'Join video call',
    };
    return this.http.post<MessageApi>(`${environment.messageApiBase}/api/messages`, body).pipe(
      map((m) => this.mapMessage(m, senderId, receiverId, senderRole, senderName, peerName)),
    );
  }

  publishTyping(_event: TypingEvent): void {
    if (!this.client?.connected || this.activeContractId == null || this.activeUserId == null || this.activeOtherUserId == null) {
      return;
    }
    this.client.publish({
      destination: '/app/typing',
      body: JSON.stringify({
        contractId: this.activeContractId,
        userId: this.activeUserId,
        otherUserId: this.activeOtherUserId,
      }),
    });
  }

  private onSocketMessage(message: IMessage): void {
    const body = JSON.parse(message.body) as { type?: string; userId?: number; message?: MessageApi };
    if (body.type === 'typing' && body.userId != null && body.userId !== this.activeUserId) {
      this.typingSubject.next({
        contractId: this.activeContractId!,
        senderId: body.userId,
        senderRole: this.activeSelfRole === 'CLIENT' ? 'FREELANCER' : 'CLIENT',
        senderName: this.activePeerName,
        typing: true,
      });
      return;
    }
    if (body.type === 'new_message' && body.message) {
      const incoming = this.mapMessage(
        body.message,
        this.activeUserId!,
        this.activeOtherUserId!,
        this.activeSelfRole,
        this.activeSelfName,
        this.activePeerName,
      );
      const exists = this.messagesSubject.value.some((item) => item.id === incoming.id);
      if (!exists) {
        this.messagesSubject.next([...this.messagesSubject.value, incoming]);
      }
    }
  }

  private mapMessageWithContract(m: MessageApi, c: Contract): ChatMessageResponse {
    const fromClient = m.senderUserId === c.clientId;
    const role: MessageSenderRole = fromClient ? 'CLIENT' : 'FREELANCER';
    const name = fromClient ? `Client #${c.clientId}` : `Freelancer #${c.freelancerId}`;
    return this.mapMessageEntity(m, role, name);
  }

  private mapMessage(
    m: MessageApi,
    selfId: number,
    otherId: number,
    selfRole: MessageSenderRole,
    selfName: string,
    peerName: string,
  ): ChatMessageResponse {
    const fromSelf = m.senderUserId === selfId;
    const role = fromSelf ? selfRole : selfRole === 'CLIENT' ? 'FREELANCER' : 'CLIENT';
    const name = fromSelf ? selfName : peerName;
    return this.mapMessageEntity(m, role, name);
  }

  private mapMessageEntity(m: MessageApi, senderRole: MessageSenderRole, senderName: string): ChatMessageResponse {
    const url = m.attachmentUrl?.trim() || null;
    const isFile = !!url && url.includes('/attachments/');
    const attachmentType = url ? (isFile ? 'FILE' : 'LINK') : null;
    const mimeFromName = this.guessMimeFromFileName(m.attachmentFileName);
    const attachmentMimeType = m.contentType?.includes('/') ? m.contentType : mimeFromName;
    const attachmentDownloadUrl = isFile && url ? url : null;

    return {
      id: m.id,
      contractId: m.contractId,
      senderId: m.senderUserId,
      senderRole,
      senderName,
      content: m.content,
      sentAt: m.sentAt.includes('T') ? m.sentAt : `${m.sentAt}T00:00:00Z`,
      attachmentType,
      attachmentLabel: m.attachmentFileName ?? null,
      attachmentUrl: url,
      attachmentFileName: m.attachmentFileName ?? null,
      attachmentMimeType,
      attachmentFileSize: null,
      attachmentDownloadUrl,
    };
  }

  private guessMimeFromFileName(name: string | null | undefined): string | null {
    if (!name) {
      return null;
    }
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) {
      return 'image/png';
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (lower.endsWith('.gif')) {
      return 'image/gif';
    }
    if (lower.endsWith('.webp')) {
      return 'image/webp';
    }
    if (lower.endsWith('.pdf')) {
      return 'application/pdf';
    }
    return null;
  }
}
