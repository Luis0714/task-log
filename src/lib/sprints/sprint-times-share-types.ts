import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";
import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import type {
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";

export type SprintTimesShareTableRow = {
  assignee: string;
  /** Una entrada por semana del sprint (mismo orden que `SprintTimesMetrics.weeks`). */
  weeks: HoursBreakdown[];
  sprint: HoursBreakdown | null;
  /** Breakdown del "Total semana" cuando la variante es una semana puntual. */
  weekTotal: HoursBreakdown | null;
  expectedHours: number;
  compliancePct: number | null;
  semaforo: SemaforoLevel | null;
  /** Esperadas y cumplimiento de la semana puntual cuando aplica. */
  weekExpectedHours: number | null;
  weekCompliancePct: number | null;
  weekSemaforo: SemaforoLevel | null;
  emphasized?: boolean;
};

export type SprintTimesShareColumn =
  | { kind: "assignee" }
  | { kind: "week"; weekIndex: number; week: SprintTimesWeekColumn }
  | { kind: "weekTotal"; label: string }
  | { kind: "sprintTotal" }
  | { kind: "expectedHours" }
  | { kind: "compliance" };

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
  hiddenAssignees: readonly string[];
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
