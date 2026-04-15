// User and Profile Models
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'freelancer' | 'client' | 'admin';
  profileImage?: string;
  phoneNumber?: string;
  companyName?: string;
  skills?: string;
  portfolioUrl?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date;
}

export interface FreelancerProfile {
  userId: string;
  title: string;
  hourlyRate: number;
  skills: string[];
  bio: string;
  portfolio: PortfolioItem[];
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  availability: 'available' | 'busy' | 'unavailable';
  languages: string[];
  location: string;
}

export interface ClientProfile {
  userId: string;
  companyName: string;
  industry: string;
  location: string;
  totalSpent: number;
  jobsPosted: number;
  rating: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
}

// Job Models
export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    amount?: number;
    hourlyRate?: { min: number; max: number };
  };
  duration: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  postedAt: Date;
  proposals: number;
  clientInfo: {
    name: string;
    rating: number;
    totalSpent: number;
    location: string;
  };
}

// Proposal Models
export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date;
  freelancerInfo: {
    name: string;
    title: string;
    rating: number;
    totalJobs: number;
    profileImage?: string;
  };
}

// Message Models
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Contract Models
export interface Contract {
  id: string;
  jobId: string;
  freelancerId: string;
  clientId: string;
  status: 'active' | 'completed' | 'cancelled';
  terms: {
    rate: number;
    paymentType: 'fixed' | 'hourly';
    totalAmount?: number;
  };
  milestones?: Milestone[];
  startDate: Date;
  endDate?: Date;
  totalPaid: number;
}

export interface Milestone {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'paid';
}

// Review Models
export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Search and Filter Models
export interface JobFilters {
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  experienceLevel?: string[];
  jobType?: string[];
  location?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
