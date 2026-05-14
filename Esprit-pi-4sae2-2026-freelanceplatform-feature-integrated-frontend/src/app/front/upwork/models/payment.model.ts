export type PaymentMethod = 'CARD' | 'WALLET' | 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus =
  | 'INITIATED'
  | 'CHECKOUT_CREATED'
  | 'PENDING'
  | 'FUNDED'
  | 'RELEASED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface PaymentRequest {
  contractId: number;
  milestoneId?: number | null;
  payerId: number;
  payeeId: number;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResponse {
  id: number;
  contractId: number;
  milestoneId: number | null;
  payerId: number;
  payeeId: number;
  amount: number;
  platformFee: number;
  netAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  stripeCheckoutSessionId: string | null;
  currency: string;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface CheckoutSessionResponse {
  paymentId: number;
  checkoutSessionId: string;
  checkoutUrl: string | null;
}

export interface RefundRequest {
  reason: string;
}
