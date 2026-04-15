export interface Reply {
  id?: number;
  author: string;
  content: string;
  createdAt?: string;
  likeCount?: number;
}

export interface ForumPost {
  id?: number;
  author: string;
  title: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  reactions?: string;   // JSON string like {"👍":3,"❤️":1}
  replies?: Reply[];
  bookmarked?: boolean;
  edited?: boolean;     // NEW: true if this post has been edited at least once
}

// NEW: Represents one entry in a post's edit history
export interface PostEditHistory {
  id?: number;
  postId: number;
  oldTitle: string;
  newTitle: string;
  oldContent: string;
  newContent: string;
  editedBy: string;
  editedAt: string;
}