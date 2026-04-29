import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForumPost, Reply, PostEditHistory } from '../models/forum.model';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private api = '/api/posts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(this.api);
  }

  getById(id: number): Observable<ForumPost> {
    return this.http.get<ForumPost>(`${this.api}/${id}`);
  }

  create(formData: FormData): Observable<ForumPost> {
    return this.http.post<ForumPost>(this.api, formData);
  }

  update(id: number, post: Partial<ForumPost>): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.api}/${id}`, post);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getReplies(postId: number): Observable<Reply[]> {
    return this.http.get<Reply[]>(`${this.api}/${postId}/replies`);
  }

  addReply(postId: number, reply: Reply): Observable<Reply> {
    return this.http.post<Reply>(`${this.api}/${postId}/replies`, reply);
  }

  addReaction(postId: number, emoji: string): Observable<ForumPost> {
    return this.http.post<ForumPost>(
      `${this.api}/${postId}/react?emoji=${encodeURIComponent(emoji)}`, {}
    );
  }

  search(q: string): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(`${this.api}/search`, { params: { q } });
  }

  toggleBookmark(id: number): Observable<ForumPost> {
    return this.http.post<ForumPost>(`${this.api}/${id}/bookmark`, {});
  }

  likeReply(replyId: number): Observable<Reply> {
    return this.http.post<Reply>(`${this.api}/replies/${replyId}/like`, {});
  }

  getPostHistory(postId: number): Observable<PostEditHistory[]> {
    return this.http.get<PostEditHistory[]>(`${this.api}/${postId}/history`);
  }
}