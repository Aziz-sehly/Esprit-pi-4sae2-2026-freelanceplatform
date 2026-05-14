export interface Review {
  id?: number;
  author: string;
  content: string;
  rating: number;
  averageRating?: number;
  createdAt?: string;
  language?: string;
}