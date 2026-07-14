import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import type { WorkItemsByStateGroup } from "@/lib/time-log/filter-work-items";

export type { HoursBreakdown } from "@/lib/hours/hours-breakdown";

export type DashboardWorkItem = AdoWorkItemOptionDto & {
  priority?: number | string;
  loggedHours?: number;
  estimatedHours?: number;
  /** Bugs hijos vinculados a esta historia en el sprint. */
  bugCount?: number;
  /** Bugs en estado atendido (QA, Stage, Done, etc.). */
  attendedBugCount?: number;
};

export type DashboardPbiStateGroup = WorkItemsByStateGroup;

export type SprintPbiProgress = {
  percent: number;
  completedCount: number;
  pendingCount: number;
  otherCount: number;
  totalCount: number;
};

export type WorkItemStatusCounts = {
  assigned: number;
  pending: number;
  inProgress: number;
  completed: number;
};

export type SprintStatusOverview = {
  userStories: WorkItemStatusCounts;
  bugs: WorkItemStatusCounts;
};

export type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";

export type SprintWeekMetrics = {
  label: string;
  hours: HoursBreakdown;
  hoursTarget: number;
  workingDaysCount: number;
  dateRangeLabel: string;
  dayKeys: string[];
};

export type DashboardMetrics = {
  hoursToday: HoursBreakdown;
  hoursSprintCurrent: HoursBreakdown;
  hoursSprintTarget: number;
  hoursRemaining: number;
  /** Capacidad esperada del día efectivo (último día laborable) = 8 × %asignación. */
  hoursDayTarget: number;
  /** Horas pendientes del día efectivo: max(0, target − reportadas). */
  hoursDayPending: number;
  /** % de asignación vigente en el día efectivo (100 por defecto si no hay tramos). */
  hoursDayAssignmentPct: number;
  /** Suma de story points / effort de historias asignadas en el sprint. */
  storyPointsAssigned: number;
  /** Story points de HUs ya desarrolladas en el sprint. */
  storyPointsDeveloped: number;
  sprintWorkingDaysCount: number;
  /** Rango de fechas del sprint filtrado, p. ej. "6 jul – 10 jul". */
  sprintDateRangeLabel: string;
  hoursByDay: SprintDayHoursPoint[];
  sprintWeeks: SprintWeekMetrics[];
  pbiStateGroups: DashboardPbiStateGroup[];
  pbiProgress: SprintPbiProgress;
  sprintStatusOverview: SprintStatusOverview;
};

export type DashboardDeliveryMetrics = Pick<
  DashboardMetrics,
  "sprintStatusOverview" | "storyPointsAssigned" | "storyPointsDeveloped" | "pbiProgress"
> & {
  huStateGroups: readonly DashboardPbiStateGroup[];
  bugStateGroups: readonly DashboardPbiStateGroup[];
};

export type DashboardWorkflowMetrics = Pick<
  DashboardMetrics,
  "pbiStateGroups" | "pbiProgress"
>;

export type DashboardHeaderData = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  project: string;
  sprintName: string;
};

