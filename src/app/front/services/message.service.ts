import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Message, MessageRequest, ConversationDto, UserDto, ReactionDto, ConversationTag, MessageAudit, UserBlockDto } from '../models/communication';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
  fileName: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  /** Utilise le proxy en dev: /messages -> localhost:8080 */
  private readonly baseUrl = environment.production ? `${environment.communicationApi}/messages` : '/messages';
  private readonly uploadUrl = environment.production ? `${environment.communicationApi}/messages/upload` : '/messages-upload';
  private readonly uploadMultipleUrl = environment.production ? `${environment.communicationApi}/messages/upload-multiple` : '/messages-upload-multiple';

  constructor(private readonly http: HttpClient) {}

  create(request: MessageRequest): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, request).pipe(
      catchError((err) => {
        console.error('MessageService.create:', err);
        throw err;
      })
    );
  }

  getById(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('MessageService.getById:', err);
        throw err;
      })
    );
  }

  list(contractId?: number, userId?: number): Observable<Message[]> {
    let params = new HttpParams();
    if (contractId != null) params = params.set('contractId', String(contractId));
    if (userId != null) params = params.set('userId', String(userId));
    return this.http.get<Message[]>(this.baseUrl, { params }).pipe(
      catchError((err) => {
        console.error('MessageService.list:', err);
        return of([]);
      })
    );
  }

  listAdmin(params: {
    contractId?: number;
    userId?: number;
    search?: string;
    date?: string;
    status?: string;
    sortOrder?: 'recent' | 'oldest';
  }): Observable<Message[]> {
    let httpParams = new HttpParams();
    if (params.contractId != null) httpParams = httpParams.set('contractId', String(params.contractId));
    if (params.userId != null) httpParams = httpParams.set('userId', String(params.userId));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.date) httpParams = httpParams.set('date', params.date);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    return this.http.get<Message[]>(`${this.baseUrl}/admin`, { params: httpParams }).pipe(
      catchError((err) => {
        console.error('MessageService.listAdmin:', err);
        return of([]);
      })
    );
  }

  adminUpdateMessage(id: number, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.baseUrl}/admin/${id}`, { content }).pipe(
      catchError((err) => {
        console.error('MessageService.adminUpdateMessage:', err);
        throw err;
      })
    );
  }

  getUsers(userId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.baseUrl}/users`, {
      params: { userId: String(userId) }
    }).pipe(
      catchError((err) => {
        console.error('MessageService.getUsers:', err);
        return of([]);
      })
    );
  }

  getConversations(userId: number): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.baseUrl}/conversations`, {
      params: { userId: String(userId) }
    }).pipe(
      catchError((err) => {
        console.error('MessageService.getConversations:', err);
        return of([]);
      })
    );
  }

  listConversation(contractId: number, userId: number, otherUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/contracts/${contractId}/conversation`, {
      params: { userId: String(userId), otherUserId: String(otherUserId) }
    }).pipe(
      catchError((err) => {
        console.error('MessageService.listConversation:', err);
        return of([]);
      })
    );
  }

  listByContract(contractId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/contracts/${contractId}`).pipe(
      catchError((err) => {
        console.error('MessageService.listByContract:', err);
        return of([]);
      })
    );
  }

  markAsRead(id: number): Observable<Message> {
    return this.http.patch<Message>(`${this.baseUrl}/${id}/read`, {}).pipe(
      catchError((err) => {
        console.error('MessageService.markAsRead:', err);
        throw err;
      })
    );
  }

  updateMessage(id: number, senderUserId: number, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.baseUrl}/${id}`, { content }, {
      params: { senderUserId: String(senderUserId) }
    }).pipe(
      catchError((err) => {
        console.error('MessageService.updateMessage:', err);
        throw err;
      })
    );
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('MessageService.deleteMessage:', err);
        throw err;
      })
    );
  }

  deleteConversation(contractId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/conversations/${contractId}`).pipe(
      catchError((err) => {
        console.error('MessageService.deleteConversation:', err);
        throw err;
      })
    );
  }

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(this.uploadUrl, formData).pipe(
      catchError((err) => {
        console.error('MessageService.uploadFile:', err);
        throw err;
      })
    );
  }

  uploadMultiple(files: File[]): Observable<UploadResponse[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<UploadResponse[]>(this.uploadMultipleUrl, formData).pipe(
      catchError((err) => {
        console.error('MessageService.uploadMultiple:', err);
        throw err;
      })
    );
  }

  getReactions(messageId: number): Observable<ReactionDto[]> {
    return this.http.get<ReactionDto[]>(`${this.baseUrl}/${messageId}/reactions`).pipe(
      catchError(() => of([]))
    );
  }

  addReaction(messageId: number, userId: number, emoji: string): Observable<ReactionDto> {
    return this.http.post<ReactionDto>(`${this.baseUrl}/${messageId}/reactions`, null, {
      params: { userId: String(userId), emoji }
    });
  }

  removeReaction(messageId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${messageId}/reactions`, {
      params: { userId: String(userId) }
    });
  }

  getReplies(parentId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/${parentId}/replies`).pipe(catchError(() => of([])));
  }

  getThread(threadId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/${threadId}/thread`).pipe(catchError(() => of([])));
  }

  blockUser(blockerUserId: number, blockedUserId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/block`, null, {
      params: { blockerUserId: String(blockerUserId), blockedUserId: String(blockedUserId) }
    });
  }

  unblockUser(blockerUserId: number, blockedUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/block`, {
      params: { blockerUserId: String(blockerUserId), blockedUserId: String(blockedUserId) }
    });
  }

  isBlocked(userId1: number, userId2: number): Observable<boolean> {
    return this.http.get<{ blocked: boolean }>(`${this.baseUrl}/block/check`, {
      params: { userId1: String(userId1), userId2: String(userId2) }
    }).pipe(
      catchError(() => of({ blocked: false })),
      map(r => r?.blocked ?? false)
    );
  }

  getBlockedUsers(userId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/block/list`, { params: { userId: String(userId) } }).pipe(
      catchError(() => of([]))
    );
  }

  getAuditLog(messageId: number): Observable<MessageAudit[]> {
    return this.http.get<MessageAudit[]>(`${this.baseUrl}/${messageId}/audit`).pipe(catchError(() => of([])));
  }

  getAuditLogByUser(userId: number, limit = 50): Observable<MessageAudit[]> {
    return this.http.get<MessageAudit[]>(`${this.baseUrl}/audit/user`, {
      params: { userId: String(userId), limit: String(limit) }
    }).pipe(catchError(() => of([])));
  }

  getAdminAnalytics(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.baseUrl}/admin/analytics`).pipe(
      catchError(() => of({}))
    );
  }

  getAdminBlocks(): Observable<UserBlockDto[]> {
    return this.http.get<UserBlockDto[]>(`${this.baseUrl}/admin/blocks`).pipe(
      catchError(() => of([]))
    );
  }

  getAllAudits(limit = 100): Observable<MessageAudit[]> {
    return this.http.get<MessageAudit[]>(`${this.baseUrl}/admin/audit`, {
      params: { limit: String(limit) }
    }).pipe(catchError(() => of([])));
  }

  getTags(contractId: number, userId: number, otherUserId: number): Observable<ConversationTag[]> {
    return this.http.get<ConversationTag[]>(`${this.baseUrl}/tags`, {
      params: { contractId: String(contractId), userId: String(userId), otherUserId: String(otherUserId) }
    }).pipe(catchError(() => of([])));
  }

  addTag(contractId: number, userId: number, otherUserId: number, tagName: string, color?: string): Observable<ConversationTag> {
    let params: any = { contractId: String(contractId), userId: String(userId), otherUserId: String(otherUserId), tagName };
    if (color) params.color = color;
    return this.http.post<ConversationTag>(`${this.baseUrl}/tags`, null, { params });
  }

  removeTag(tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tags/${tagId}`);
  }

  archiveConversation(contractId: number, userId: number, otherUserId: number, archived: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/archive`, null, {
      params: { contractId: String(contractId), userId: String(userId), otherUserId: String(otherUserId), archived: String(archived) }
    });
  }

  translate(text: string, from = 'auto', to = 'en'): Observable<{ original: string; translated: string }> {
    return this.http.post<{ original: string; translated: string }>(`${this.baseUrl}/translate`, null, {
      params: { text, from, to }
    });
  }

  getAttachment(url: string): Observable<Blob> {
    const path = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = environment.production ? `${environment.communicationApi}${path}` : path;
    return this.http.get(fullUrl, { responseType: 'blob' }).pipe(
      catchError((err) => {
        console.error('MessageService.getAttachment:', err);
        throw err;
      })
    );
  }
}
