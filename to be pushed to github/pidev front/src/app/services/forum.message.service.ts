import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface InboxEntry {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class ForumMessageService {
  private api = 'http://localhost:8082/api/messages';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  sendMessage(recipientId: number, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      this.api,
      { recipientId, content },
      { headers: this.headers() }
    );
  }

  getConversation(recipientId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.api}/conversation/${recipientId}`,
      { headers: this.headers() }
    );
  }

  getInbox(): Observable<InboxEntry[]> {
    return this.http.get<InboxEntry[]>(
      `${this.api}/inbox`,
      { headers: this.headers() }
    );
  }

  // Resolve a user by email via the User Service public endpoint
  getUserByEmail(email: string): Observable<any> {
    return this.http.get<any>(
      `http://localhost:8084/api/users/public/email/${encodeURIComponent(email)}`
    );
  }
}