import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import type {
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";

export type SprintTimesShareTableRow = {
  assignee: string;
  week1: HoursBreakdown | null;
  week2: HoursBreakdown | null;
  sprint: HoursBreakdown | null;
  weekTotal: HoursBreakdown | null;
  emphasized?: boolean;
};

export type SprintTimesShareColumn =
  | { kind: "assignee" }
  | { kind: "week"; weekKey: "week1" | "week2"; week: SprintTimesWeekColumn }
  | { kind: "weekTotal"; label: string }
  | { kind: "sprintTotal" };

export type SprintTimesShareTableLayout = {
  columns: SprintTimesShareColumn[];
  rows: SprintTimesShareTableRow[];
  teamTotalRow: SprintTimesShareTableRow;
};

export type SprintTimesShareContext = {
  projectName: string;
  teamName: string;
  sprintName: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
  goalOnly: boolean;
  dataSourceLabel: string;
  variant: SprintTimesShareVariant;
};

export type SprintTimesSharePayload = {
  generatedAt: Date;
  platformName: string;
  projectName: string;
  teamName: string;
  sprintName: string;
  sprintDateRange: string | null;
  variant: SprintTimesShareVariant;
  variantLabel: string;
  scopeLabel: string;
  dataSourceLabel: string;
  table: SprintTimesShareTableLayout;
};
