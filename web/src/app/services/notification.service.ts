import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);

  readonly notifications$ = this.notificationsSubject.asObservable();

  private milestoneClient: Client | null = null;
  private paymentClient: Client | null = null;
  private connected = false;

  connect(): void {
    if (this.connected) {
      return;
    }

    this.milestoneClient = this.createClient(environment.milestoneWsUrl, 'milestone');
    this.paymentClient = this.createClient(environment.paymentWsUrl, 'payment');
    this.milestoneClient.activate();
    this.paymentClient.activate();
    this.connected = true;
  }

  markAllRead(): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.map((notification) => ({ ...notification, read: true }))
    );
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  get unreadCount(): number {
    return this.notificationsSubject.value.filter((notification) => !notification.read).length;
  }

  latestForContract(contractId: number): AppNotification | null {
    return this.notificationsSubject.value.find((notification) => notification.contractId === contractId) ?? null;
  }

  disconnect(): void {
    this.milestoneClient?.deactivate();
    this.paymentClient?.deactivate();
    this.milestoneClient = null;
    this.paymentClient = null;
    this.connected = false;
  }

  private createClient(brokerURL: string, source: 'milestone' | 'payment'): Client {
    return new Client({
      brokerURL,
      reconnectDelay: 3000,
      onConnect: () => {
        const client = source === 'milestone' ? this.milestoneClient : this.paymentClient;
        client?.subscribe('/topic/notifications', (message) => this.pushNotification(message, source));
      },
    });
  }

  private pushNotification(message: IMessage, source: 'milestone' | 'payment'): void {
    const incoming = JSON.parse(message.body) as Omit<AppNotification, 'source' | 'read'>;
    const notification: AppNotification = {
      ...incoming,
      source,
      read: false,
    };

    const key = `${source}-${notification.type}-${notification.paymentId ?? 'none'}-${notification.milestoneId ?? 'none'}-${notification.createdAt}`;
    const exists = this.notificationsSubject.value.some(
      (item) =>
        `${item.source}-${item.type}-${item.paymentId ?? 'none'}-${item.milestoneId ?? 'none'}-${item.createdAt}` === key
    );

    if (!exists) {
      this.notificationsSubject.next([notification, ...this.notificationsSubject.value].slice(0, 25));
    }
  }
}
