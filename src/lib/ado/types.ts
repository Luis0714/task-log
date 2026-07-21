import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
import type { AssignmentSegment } from "@/lib/expected-hours";
import type {
  AdoProjectDto,
  AdoSprintDto,
  AdoTaskStateDto,
  AdoTeamDto,
  AdoWorkItemOptionDto,
} from "@/lib/schemas/ado-catalog";

export type AdoCatalogErrors = {
  projects: string | null;
  teams: string | null;
  sprints: string | null;
};

export type AdoCatalogSnapshot = {
  projects: AdoProjectDto[];
  teams: AdoTeamDto[];
  /** Equipos de cada proyecto del catálogo, indexados por nombre de proyecto. */
  teamsByProject: Record<string, AdoTeamDto[]>;
  sprints: AdoSprintDto[];
  defaultProject: string | null;
  defaultTeam: string | null;
  suggestedTeam: string | null;
  project: string;
  team: string;
  sprintPath: string;
  errors: AdoCatalogErrors;
};

export type AdoContextSearchParams = {
  project?: string;
  team?: string;
  sprint?: string;
  assignee?: string;
  sprintDay?: string;
};

export type DashboardSprintBundle = {
  workItems: AdoWorkItemOptionDto[];
  bugs: AdoWorkItemOptionDto[];
  tasks: AdoWorkItemOptionDto[];
  backlogStates: AdoTaskStateDto[];
  bugStates?: AdoTaskStateDto[];
  nonWorkingDates: string[];
  userAssignmentSegments: readonly AssignmentSegment[];
  error: string | null;
};

export type AdoContextFields = Omit<
  AdoContextSelectFieldsProps,
  | "onProjectChange"
  | "onTeamChange"
  | "onSprintChange"
  | "sprintDayFilter"
  | "className"
>;
