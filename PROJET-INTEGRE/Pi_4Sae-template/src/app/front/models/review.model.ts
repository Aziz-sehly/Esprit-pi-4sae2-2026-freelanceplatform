export interface Review {
  id?: number;
  author: string;
  content: string;
  rating: number;
  averageRating?: number;
  createdAt?: string;
  language?: string;
  reviewReason?: string;
  bookmarked?: boolean;
  helpfulVotes?: number;
  sentiment?: string;
  edited?: boolean;     // NEW: true if this review has been edited at least once
}

// NEW: Represents one entry in a review's edit history
export interface ReviewEditHistory {
  id?: number;
  reviewId: number;
  oldContent: string;
  newContent: string;
  oldRating: number;
  newRating: number;
  editedBy: string;
  editedAt: string;
}