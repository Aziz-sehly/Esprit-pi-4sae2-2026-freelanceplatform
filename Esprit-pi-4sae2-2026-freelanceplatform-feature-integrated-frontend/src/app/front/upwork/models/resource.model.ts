export type ResourceEntityType = 'CONTRACT' | 'MILESTONE';
export type ResourceType = 'FILE' | 'LINK';
export type ResourceCategory = 'BRIEF' | 'REFERENCE' | 'DELIVERABLE' | 'REVISION_PROOF';

export interface ResourceResponse {
  id: number;
  entityType: ResourceEntityType;
  entityId: number;
  resourceType: ResourceType;
  category: ResourceCategory;
  label: string;
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  downloadUrl: string | null;
}

export interface ResourceLinkRequest {
  entityType: ResourceEntityType;
  entityId: number;
  category: ResourceCategory;
  label: string;
  url: string;
}
