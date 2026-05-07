import { MessageSenderRole } from './chat.model';

export type DisputeReason =
  | 'QUALITY_ISSUE'
  | 'DELAY'
  | 'PAYMENT_ISSUE'
  | 'COMMUNICATION'
  | 'SCOPE_CHANGE'
  | 'OTHER';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface DisputeCreateRequest {
  contractId: number;
  milestoneId: number | null;
  paymentId: number | null;
  reason: DisputeReason;
  openedByRole: MessageSenderRole;
  openedById: number;
  openedByName: string;
  title: string;
  description: string;
}

export interface DisputeDecisionRequest {
  note: string;
}

export interface DisputeResponse {
  id: number;
  contractId: number;
  milestoneId: number | null;
  paymentId: number | null;
  reason: DisputeReason;
  status: DisputeStatus;
  openedByRole: MessageSenderRole;
  openedById: number;
  openedByName: string;
  title: string;
  description: string;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

/** Réponse JSON brute du dispute-service (domain Dispute). */
export interface DisputeApi {
  id: number;
  contractId: number;
  raisedByUserId: number;
  contactUserId?: number | null;
  disputeType: string;
  reason: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionType?: string | null;
  resolutionNote?: string | null;
  refundAmount?: number | null;
  createdAt: string;
  resolvedAt?: string | null;
  deadlineAt?: string | null;
}
