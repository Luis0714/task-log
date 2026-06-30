import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
import type { SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import type {
  AdoProjectDto,
  AdoSprintDto,
  AdoTaskStateDto,
  AdoTeamDto,
  AdoTeamMemberDto,
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

export type WorkItemsListsSnapshot = {
  sprintWorkItems: AdoWorkItemOptionDto[];
  sprintBugs: AdoWorkItemOptionDto[];
  backlogStates: AdoTaskStateDto[];
  bugStates?: AdoTaskStateDto[];
  userStoryMapping?: SprintStatusMapping;
  bugMapping?: SprintStatusMapping;
  teamMembers: AdoTeamMemberDto[];
  error: string | null;
};

export type DashboardSprintBundle = {
  workItems: AdoWorkItemOptionDto[];
  bugs: AdoWorkItemOptionDto[];
  tasks: AdoWorkItemOptionDto[];
  backlogStates: AdoTaskStateDto[];
  bugStates?: AdoTaskStateDto[];
  nonWorkingDates: string[];
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
