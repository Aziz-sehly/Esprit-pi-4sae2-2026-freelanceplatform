export interface Reply {
  id?: number;
  author: string;
  content: string;
  createdAt?: string;
}

export interface ForumPost {
  id?: number;
  author: string;
  title: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string; // NEW: optional audio file URL
  videoUrl?: string; // NEW: optional YouTube/Vimeo embed URL
  createdAt?: string;
  reactions?: string; // JSON string like {"👍":3,"❤️":1}
  replies?: Reply[];
}