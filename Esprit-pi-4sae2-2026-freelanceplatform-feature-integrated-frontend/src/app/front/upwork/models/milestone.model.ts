export type MilestoneStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'FUNDED'
  | 'OVERDUE'
  | 'PAID';

export interface MilestoneResponse {
  id: number;
  contractId: number;
  title: string;
  deliverable: string;
  amount: number;
  dueDate: string | null;
  status: MilestoneStatus;
  revisionCount: number;
  lastFeedback: string | null;
  submittedAt: string | null;
  clientApprovedAt: string | null;
  fundedAt: string | null;
  paidAt: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
}

export interface MilestoneRequest {
  contractId: number;
  title: string;
  deliverable: string;
  amount: number;
  dueDate: string | null;
}

export interface MilestoneFeedbackRequest {
  feedback: string;
  actorId?: number | null;
}
