// models.ts - Complete file with all interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'freelancer' | 'client';
  profileImage?: string;
  createdAt: Date;
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

// =========================
// Project Models
// =========================

export enum Experience {
  ENTRY = 'ENTRY',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export enum Status {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

export interface ProjectDto {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category: string;
  skills: string;
  budget_min: number;
  budget_max: number;
  duration: string;
  experienceLevel: Experience;
  status: Status;
  deadline: Date;
}

export interface Project {
  id: number;
  clientId: number;
  clientEmail?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: Experience;
  status: Status;
  deadline: Date;
  proposalsCount?: number;
}

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED' | 'NEGOTIATING';
export type PaymentStructureType = 'FIXED' | 'HOURLY' | 'MILESTONE';

export interface ProposalApi {
  id?: number;
  projectId: number;
  freelancerId: number;
  proposedPrice: number;
  deliveryDays: number;
  coverLetter: string;
  status: string;
  isInvited: boolean;
  revisionsOffered: number;
  paymentStructure?: PaymentStructureType;
  hourlyRate?: number;
  estimatedHoursPerWeek?: number;
  milestoneCount?: number;
  milestoneDetails?: string;
}

export interface Milestone {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  completed?: boolean;
}

export interface ProjectProposal {
  id: number;
  projectId: number;
  freelancerId: number;
  coverLetter: string;
  proposedBudget: number;
  estimatedDuration: string;
  status: ProposalStatus;
  submittedAt: Date;
  expiresAt?: Date;
  hiddenByClient?: boolean;
  deliveryDays?: number;
  isInvited?: boolean;
  revisionsOffered?: number;
  
  // Payment Structure Fields
  paymentStructure?: PaymentStructureType;
  hourlyRate?: number;
  estimatedHoursPerWeek?: number;
  milestoneCount?: number;
  milestoneDetails?: string;
  milestones?: Milestone[];
  
  // Counter-offer fields
  counterOfferPrice?: number;
  counterOfferMessage?: string;
  counterOfferAt?: Date;
  counterPaymentStructure?: PaymentStructureType;
  counterHourlyRate?: number;
  counterEstimatedHoursPerWeek?: number;
  counterMilestoneCount?: number;
  counterMilestoneDetails?: string;
}

export interface EnhancedCounterOfferRequest {
  counterPrice: number;
  message: string;
  paymentStructure?: PaymentStructureType;
  hourlyRate?: number;
  estimatedHoursPerWeek?: number;
  milestoneCount?: number;
  milestoneDetails?: string;
  milestones?: Milestone[];
}

export interface ProjectFilters {
  category?: string;
  status?: Status;
  budgetMin?: number;
  budgetMax?: number;
  experienceLevel?: Experience;
  query?: string;
  clientId?: number;
}

export interface FreelancerProposalStats {
  freelancerId: number;
  totalProposals: number;
  acceptedProposals: number;
  acceptanceRate: number;
}

export interface FreelancerStatsDTO {
  freelancerId: number;
  totalProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  pendingProposals: number;
  acceptanceRate: number;
  avgProposedPrice: number;
  avgDeliveryDays: number;
  avgResponseTimeHours: number;
}

export interface RankedProposalDTO {
  proposal: ProjectProposal;
  score: number;
  scoreBreakdown: string;
}

export interface CounterOffer {
  id?: number;
  price: number;
  message: string;
  createdAt?: Date;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface CounterOfferRequest {
  counterPrice: number;
  message: string;
}

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

export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

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

export interface PopularProject {
  id: number;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  status: string;
  proposalsCount: number;
}

export interface ProjectStatsDTO {
  totalProjects: number;
  openProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  archivedProjects: number;
  averageBudgetMin: number;
  averageBudgetMax: number;
  averageBudget: number;
  totalBudgetMax: number;
  mostPopularProjects: PopularProject[];
  topCategories: string[];
  topSkills: string[];
}