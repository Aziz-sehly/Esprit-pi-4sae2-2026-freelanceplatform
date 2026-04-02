/** Modèles pour le microservice Communication (Messages + Disputes) */

export type MessageStatus = 'SENT' | 'READ';

export interface Message {
  id: number;
  contractId: number;
  senderUserId: number;
  receiverUserId: number;
  content: string;
  status: MessageStatus;
  sentAt: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  parentId?: number;
  threadId?: number;
  ephemeralMinutes?: number;
  ephemeralSeconds?: number;
  scheduledAt?: string;
  isArchived?: boolean;
  contentType?: string;
}

export interface MessageRequest {
  contractId: number;
  senderUserId: number;
  receiverUserId: number;
  content: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  parentId?: number;
  threadId?: number;
  ephemeralMinutes?: number;
  ephemeralSeconds?: number;
  scheduledAt?: string;
  contentType?: string;
}

export interface ReactionDto {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
}

export interface ConversationTag {
  id: number;
  contractId: number;
  userId: number;
  otherUserId: number;
  tagName: string;
  color?: string;
  createdAt: string;
}

export interface MessageAudit {
  id: number;
  messageId: number;
  action: string;
  userId: number;
  details?: string;
  performedAt: string;
}

export interface UserBlockDto {
  id: number;
  blockerUserId: number;
  blockedUserId: number;
  blockedAt: string;
}

export interface ConversationDto {
  contractId: number;
  otherUserId: number;
  lastMessage?: Message;
  unreadCount: number;
}

export interface UserDto {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}


export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export type ResolutionType = 'REFUND_TO_CLIENT' | 'PAY_TO_FREELANCER' | 'SPLIT_PAYMENT' | 'NO_ACTION';

export interface Dispute {
  id: number;
  contractId: number;
  raisedByUserId: number;
  resolvedByUserId?: number;
  disputeType: string;
  reason: string;
  status: DisputeStatus;
  resolutionType?: ResolutionType;
  resolutionNote?: string;
  refundAmount?: number;
  createdAt: string;
  deadlineAt?: string;
  resolvedAt?: string;
}

export interface CreateDisputeRequest {
  contractId: number;
  raisedByUserId: number;
  disputeType: string;
  reason: string;
}

export interface UpdateDisputeRequest {
  disputeType: string;
  reason: string;
}

export interface ResolveDisputeRequest {
  resolvedByUserId: number;
  status: DisputeStatus;
  resolutionType?: ResolutionType;
  resolutionNote?: string;
  refundAmount?: number;
}

export interface DisputeDetailsResponse {
  dispute: Dispute;
  relatedMessages: Message[];
}

export interface Evidence {
  id: number;
  disputeId: number;
  uploaderUserId: number;
  fileUrl: string;
  fileName: string;
  category?: string;
  adminNote?: string | null;
  createdAt: string;
}

export interface EvidenceCreateRequest {
  fileUrl: string;
  fileName: string;
  category?: string;
}

export interface AuditEvent {
  eventType: string;
  actorUserId?: number | null;
  details?: string | null;
  createdAt: string;
}
