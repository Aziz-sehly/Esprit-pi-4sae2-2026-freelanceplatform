import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import { ChatLinkMessageRequest, ChatMessageRequest, ChatMessageResponse, TypingEvent, MessageSenderRole } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ContractChatService {
  private readonly messagesSubject = new BehaviorSubject<ChatMessageResponse[]>([]);
  private readonly typingSubject = new BehaviorSubject<TypingEvent | null>(null);

  readonly messages$ = this.messagesSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();

  private client: Client | null = null;
  private activeContractId: number | null = null;

  constructor(private readonly http: HttpClient) {}

  connect(contractId: number): void {
    if (this.activeContractId === contractId && this.client?.connected) {
      return;
    }

    this.disconnect();
    this.activeContractId = contractId;
    this.client = new Client({
      brokerURL: environment.milestoneWsUrl,
      reconnectDelay: 3000,
      onConnect: () => {
        this.client?.subscribe(`/topic/contracts/${contractId}/chat`, (message) => this.onMessage(message));
        this.client?.subscribe(`/topic/contracts/${contractId}/typing`, (message) => this.onTyping(message));
      },
    });
    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.activeContractId = null;
    this.messagesSubject.next([]);
    this.typingSubject.next(null);
  }

  loadHistory(contractId: number): void {
    this.history(contractId)
      .subscribe((messages) => this.messagesSubject.next(messages ?? []));
  }

  history(contractId: number) {
    return this.http.get<ChatMessageResponse[]>(`${environment.apiGateway}/milestone/api/contracts/${contractId}/chat`);
  }

  send(contractId: number, payload: ChatMessageRequest) {
    return this.http.post<ChatMessageResponse>(`${environment.apiGateway}/milestone/api/contracts/${contractId}/chat`, payload);
  }

  sendLink(contractId: number, payload: ChatLinkMessageRequest) {
    return this.http.post<ChatMessageResponse>(`${environment.apiGateway}/milestone/api/contracts/${contractId}/chat/links`, payload);
  }

  sendFile(
    contractId: number,
    senderId: number,
    senderRole: MessageSenderRole,
    senderName: string,
    file: File,
    label?: string,
    content?: string
  ) {
    const form = new FormData();
    form.append('senderId', String(senderId));
    form.append('senderRole', senderRole);
    form.append('senderName', senderName);
    form.append('file', file);
    if (label?.trim()) {
      form.append('label', label.trim());
    }
    if (content?.trim()) {
      form.append('content', content.trim());
    }
    return this.http.post<ChatMessageResponse>(`${environment.apiGateway}/milestone/api/contracts/${contractId}/chat/files`, form);
  }

  announceCall(contractId: number, senderId: number, senderRole: MessageSenderRole, senderName: string) {
    return this.http.post<void>(`${environment.apiGateway}/milestone/api/contracts/${contractId}/chat/call`, {
      senderId,
      senderRole,
      senderName,
    });
  }

  publishTyping(event: TypingEvent): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination: `/app/contracts/${event.contractId}/typing`,
      body: JSON.stringify({ ...event, createdAt: new Date().toISOString() }),
    });
  }

  private onMessage(message: IMessage): void {
    const incoming = JSON.parse(message.body) as ChatMessageResponse;
    const exists = this.messagesSubject.value.some((item) => item.id === incoming.id);
    if (!exists) {
      this.messagesSubject.next([...this.messagesSubject.value, incoming]);
    }
  }

  private onTyping(message: IMessage): void {
    const incoming = JSON.parse(message.body) as TypingEvent;
    this.typingSubject.next(incoming.typing ? incoming : null);
  }
}
