export const RELEASE_TABS = ["all", "pending"] as const;

export type ReleaseTab = (typeof RELEASE_TABS)[number];

export const RELEASE_STAGE_STATUSES = [
  "succeeded",
  "needs_approval",
  "in_progress",
  "waiting",
  "rejected",
  "canceled",
] as const;

export type ReleaseStageStatus = (typeof RELEASE_STAGE_STATUSES)[number];

export type ReleaseDefinitionOption = {
  id: number;
  name: string;
};

export type ReleaseStage = {
  id: number;
  name: string;
  shortName: string;
  status: ReleaseStageStatus;
  approvalId: number | null;
  canApprove: boolean;
  assignedToMe: boolean;
};

export type ReleaseListItem = {
  id: number;
  name: string;
  definitionName: string;
  createdAt: string;
  createdBy: string;
  branch: string;
  pendingCount: number;
  stages: readonly ReleaseStage[];
};

export type ReleaseListSnapshot = {
  definitions: readonly ReleaseDefinitionOption[];
  items: readonly ReleaseListItem[];
  pendingCount: number;
  definitionId: number | null;
};

export type ReleaseApprovalTarget = {
  approvalId: number;
  environmentName: string;
  environmentShortName: string;
  releaseName: string;
  createdBy: string;
  branch: string;
};
