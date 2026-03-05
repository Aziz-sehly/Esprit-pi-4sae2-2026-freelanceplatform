export interface Review {
  id?: number;
  author: string;
  content: string;
  rating: number;
  averageRating?: number;
  createdAt?: string;
  language?: string;
  reviewReason?: string; // NEW: reason for leaving the review
}