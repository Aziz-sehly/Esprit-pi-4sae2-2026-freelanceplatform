export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPTANCE'
  | 'ACTIVE'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ContractRequest {
  clientId: number;
  freelancerId: number;
  title: string;
  scope: string;
  totalBudget: number;
  clientName: string;
  freelancerName: string;
  startDate: string | null;
  endDate: string | null;
}

export interface ContractResponse {
  id: number;
  clientId: number;
  freelancerId: number;
  title: string;
  scope: string;
  totalBudget: number;
  clientName: string;
  freelancerName: string;
  startDate: string | null;
  endDate: string | null;
  respondedAt: string | null;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}
