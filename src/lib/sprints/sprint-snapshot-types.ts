import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";
import type {
  SprintBugQualityMetrics,
  SprintTimesMetrics,
  SprintWorkflowSectionMetrics,
} from "@/lib/sprints/sprint-stats-types";

export type SprintSnapshotSource = "manual" | "auto";

export type SprintStoryGoalStatus =
  | "achieved"
  | "partial"
  | "missed"
  | "excluded"
  | "no_target";

export type SprintSnapshotSummary = {
  goalsTotalCount: number;
  goalsAchievedCount: number;
  goalsPartialCount: number;
  goalsMissedCount: number;
  goalsExcludedCount: number;
  goalsNoTargetCount: number;
  storyPointsInGoal: number;
  storyPointsAchieved: number;
};

export type SprintStorySnapshotData = {
  workItemId: number;
  title: string;
  assignedTo: string | null;
  effort: number | null;
  includedInGoal: boolean;
  baselineStateName: string | null;
  baselineTacTagName: string | null;
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
  goalStatus: SprintStoryGoalStatus;
  observation: string | null;
};

export type SprintSnapshotOperationalMetrics = {
  delivery: DashboardDeliveryMetrics;
  workflow: SprintWorkflowSectionMetrics;
  bugs: SprintBugQualityMetrics;
  times: SprintTimesMetrics;
};

/** Métricas operativas congeladas por alcance (equipo vs historias del objetivo). */
export type SprintSnapshotStatsPayload = {
  team: SprintSnapshotOperationalMetrics;
  goal: SprintSnapshotOperationalMetrics;
};

export type SprintSnapshotData = {
  id: string;
  version: number;
  finalizedAt: Date;
  finalizedByUserId: string | null;
  finalizedByDisplayName: string | null;
  source: SprintSnapshotSource;
  generalObjective: string | null;
  sprintName: string | null;
  sprintStartDate: string | null;
  sprintFinishDate: string | null;
  summary: SprintSnapshotSummary;
  stories: SprintStorySnapshotData[];
  statsPayload: SprintSnapshotStatsPayload | null;
};

export type SaveSprintSnapshotInput = {
  source: SprintSnapshotSource;
  finalizedAt?: Date;
  finalizedByUserId?: string | null;
  finalizedByDisplayName?: string | null;
  generalObjective: string | null;
  sprintName?: string | null;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
  stories: SprintStorySnapshotData[];
  statsPayload?: SprintSnapshotStatsPayload | null;
};
