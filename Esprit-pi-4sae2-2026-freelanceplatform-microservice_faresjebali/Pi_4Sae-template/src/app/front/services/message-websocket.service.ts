import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

export interface TypingEvent {
  type: 'typing';
  userId: number;
}

export interface NewMessageEvent {
  type: 'new_message';
  message: any;
}

export interface PresenceEvent {
  type: 'presence';
  userId: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class MessageWebSocketService {
  private client: Client | null = null;
  private connected = false;
  /** Dev : même hôte que ng serve + proxy /ws -> ProLance gateway :8080 */
  private readonly wsUrl = environment.production
    ? `${environment.prolanceGatewayUrl.replace(/^http/, 'ws')}/ws/messages`
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/messages`;

  readonly typing$ = new Subject<TypingEvent>();
  readonly newMessage$ = new Subject<NewMessageEvent>();
  readonly presence$ = new Subject<PresenceEvent>();

  private presenceHeartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private readonly PRESENCE_HEARTBEAT_MS = 25000;

  connect(): void {
    if (this.client?.active) return;
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl.replace('ws', 'http').replace('wss', 'https')) as any,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        const uid = (window as any).__prolanceUserId;
        if (uid != null) {
          this.sendPresence(uid, 'online');
          this.startPresenceHeartbeat();
        }
        const p = this.pendingSubscribe;
        if (p) {
          this.doSubscribe(p.contractId, p.userId, p.otherUserId);
          this.subscribeToPresence(p.otherUserId);
          this.pendingSubscribe = null;
        }
        this.pendingPresenceIds.forEach(id => this.subscribeToPresence(id));
        this.pendingPresenceIds.clear();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });
    this.client.activate();
  }

  private pendingSubscribe: { contractId: number; userId: number; otherUserId: number } | null = null;
  private pendingPresenceIds = new Set<number>();
  private presenceSubscriptions = new Set<number>();

  private startPresenceHeartbeat(): void {
    this.stopPresenceHeartbeat();
    const uid = (window as any).__prolanceUserId;
    if (uid == null) return;
    this.presenceHeartbeatInterval = setInterval(() => {
      if (this.client?.active) this.sendPresence(uid, 'online');
    }, this.PRESENCE_HEARTBEAT_MS);
  }

  private stopPresenceHeartbeat(): void {
    if (this.presenceHeartbeatInterval) {
      clearInterval(this.presenceHeartbeatInterval);
      this.presenceHeartbeatInterval = null;
    }
  }

  subscribeToPresence(userId: number): void {
    if (this.presenceSubscriptions.has(userId)) return;
    if (!this.client?.active) {
      this.pendingPresenceIds.add(userId);
      return;
    }
    const topic = `/topic/presence/${userId}`;
    this.client?.subscribe(topic, (msg) => {
      const body = JSON.parse(msg.body);
      this.presence$.next({ type: 'presence', userId: body.userId, status: body.status || 'offline' });
    });
    this.presenceSubscriptions.add(userId);
  }

  unsubscribeFromPresence(userId: number): void {
    this.presenceSubscriptions.delete(userId);
  }

  subscribeToConversation(contractId: number, userId: number, otherUserId: number): void {
    if (!this.client) {
      this.pendingSubscribe = { contractId, userId, otherUserId };
      return;
    }
    if (this.client.active) {
      this.doSubscribe(contractId, userId, otherUserId);
    } else {
      this.pendingSubscribe = { contractId, userId, otherUserId };
    }
  }

  private doSubscribe(contractId: number, userId: number, otherUserId: number): void {
    const topic = `/topic/conv/${contractId}/${Math.min(userId, otherUserId)}/${Math.max(userId, otherUserId)}`;
    this.client?.subscribe(topic, (msg) => {
      const body = JSON.parse(msg.body);
      if (body.type === 'typing') this.typing$.next({ type: 'typing', userId: body.userId });
      if (body.type === 'new_message') this.newMessage$.next({ type: 'new_message', message: body.message });
    });
  }

  sendTyping(contractId: number, userId: number, otherUserId: number): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: '/app/typing',
      body: JSON.stringify({ contractId, userId, otherUserId })
    });
  }

  sendPresence(userId: number, status: 'online' | 'offline'): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: '/app/presence',
      body: JSON.stringify({ userId, status })
    });
  }

  disconnect(): void {
    this.stopPresenceHeartbeat();
    const uid = (window as any).__prolanceUserId;
    if (uid != null) this.sendPresence(uid, 'offline');
    this.client?.deactivate();
    this.connected = false;
    this.presenceSubscriptions.clear();
    this.pendingPresenceIds.clear();
  }
}
