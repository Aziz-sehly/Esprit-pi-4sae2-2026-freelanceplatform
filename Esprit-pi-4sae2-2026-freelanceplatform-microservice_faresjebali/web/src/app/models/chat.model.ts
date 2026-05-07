export type MessageSenderRole = 'CLIENT' | 'FREELANCER';
export type ChatAttachmentType = 'FILE' | 'LINK';

export interface ChatMessageRequest {
  senderId: number;
  senderRole: MessageSenderRole;
  senderName: string;
  content: string;
}

export interface ChatLinkMessageRequest {
  senderId: number;
  senderRole: MessageSenderRole;
  senderName: string;
  content?: string | null;
  label: string;
  url: string;
}

export interface ChatMessageResponse {
  id: number;
  contractId: number;
  senderId: number;
  senderRole: MessageSenderRole;
  senderName: string;
  content: string | null;
  sentAt: string;
  attachmentType: ChatAttachmentType | null;
  attachmentLabel: string | null;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentFileSize: number | null;
  attachmentDownloadUrl: string | null;
}

export interface TypingEvent {
  contractId: number;
  senderId: number;
  senderRole: MessageSenderRole;
  senderName: string;
  typing: boolean;
  createdAt?: string;
}
