import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewEditHistory } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = '/api/reviews';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Review[]> {
    return this.http.get<Review[]>(this.api);
  }

  getById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.api}/${id}`);
  }

  create(review: Review): Observable<Review> {
    return this.http.post<Review>(this.api, review);
  }

  update(id: number, review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.api}/${id}`, review);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getAverageRating(): Observable<{ averageRating: number }> {
    return this.http.get<{ averageRating: number }>(`${this.api}/average`);
  }

  search(q: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/search`, { params: { q } });
  }

  toggleBookmark(id: number): Observable<Review> {
    return this.http.post<Review>(`${this.api}/${id}/bookmark`, {});
  }

  addHelpfulVote(id: number): Observable<Review> {
    return this.http.post<Review>(`${this.api}/${id}/helpful`, {});
  }

  getReviewHistory(reviewId: number): Observable<ReviewEditHistory[]> {
    return this.http.get<ReviewEditHistory[]>(`${this.api}/${reviewId}/history`);
  }
}