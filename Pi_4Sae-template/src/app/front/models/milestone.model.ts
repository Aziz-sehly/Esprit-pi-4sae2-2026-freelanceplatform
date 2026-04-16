export type MilestoneStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'PAID';

export interface MilestoneResponse {
    id: number;
    contractId: number;
    title: string;
    deliverable: string;
    amount: number;
    dueDate: string | null;
    status: MilestoneStatus;
    submittedAt: string | null;
    clientApprovedAt: string | null;
    paidAt: string | null;
    createdAt: string;
}

export interface MilestoneRequest {
    contractId: number;
    title: string;
    deliverable: string;
    amount: number;
    dueDate: string | null;
}
