// src/app/core/models/milestone.model.ts
export type MilestoneStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'PAID';

export interface MilestoneResponse {
    id: number;
    contractId: number;
    title: string;
    deliverable: string;
    amount: number;              // backend BigDecimal -> number in TS
    dueDate: string | null;      // LocalDate -> 'YYYY-MM-DD'
    status: MilestoneStatus;
    submittedAt: string | null
    clientApprovedAt: string | null; // LocalDateTime -> ISO string
    paidAt: string | null;
    createdAt: string;           // ISO string
}

export interface MilestoneRequest {
    contractId: number;
    title: string;
    deliverable: string;
    amount: number;
    dueDate: string | null; // 'YYYY-MM-DD'
}