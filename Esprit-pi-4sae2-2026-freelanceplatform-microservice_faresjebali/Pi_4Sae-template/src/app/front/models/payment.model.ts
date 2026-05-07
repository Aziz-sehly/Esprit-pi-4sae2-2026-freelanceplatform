export type PaymentMethod = 'CARD' | 'WALLET' | 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

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
    method: PaymentMethod;
    status: PaymentStatus;
    provider: string;
    providerRef: string | null;
    createdAt: string;
}
