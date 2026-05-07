export interface AppNotification {
  type: string;
  contractId: number | null;
  milestoneId: number | null;
  paymentId: number | null;
  message: string;
  createdAt: string;
  source: 'milestone' | 'payment';
  read: boolean;
}
