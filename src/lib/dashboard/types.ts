import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import type { WorkItemsByStateGroup } from "@/lib/time-log/filter-work-items";

export type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";

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
  /** Suma de story points / effort de historias asignadas en el sprint. */
  storyPointsAssigned: number;
  sprintWorkingDaysCount: number;
  hoursByDay: SprintDayHoursPoint[];
  sprintWeeks: SprintWeekMetrics[];
  pbiStateGroups: DashboardPbiStateGroup[];
  pbiProgress: SprintPbiProgress;
  sprintStatusOverview: SprintStatusOverview;
};

export type DashboardHeaderData = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  project: string;
  sprintName: string;
};

export type DashboardSectionLoading = {
  /** Selectores de proyecto/equipo/sprint y día del sprint. */
  context: boolean;
  /** KPIs y gráfico de entrega (historias + bugs). */
  delivery: boolean;
  /** Horas del día, sprint y semanas (tasks + bugs + días libres). */
  hours: boolean;
  /** Progreso PBI y barras por estado (historias). */
  workflow: boolean;
  /** Resumen daily (historias en progreso). */
  daily: boolean;
};

