import type { AdoProjectDto, AdoSprintDto, AdoTaskStateDto, AdoTeamDto, AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import type { WorkItemsByStateGroup } from "@/lib/time-log/filter-work-items";

export type TimeLogCatalogPlaceholders = {
  project: string;
  team: string;
  sprint: string;
  pbi: string;
};

export type TimeLogCatalog = {
  project: string;
  team: string;
  sprintPath: string;
  projects: AdoProjectDto[];
  teams: AdoTeamDto[];
  sprints: AdoSprintDto[];
  pbis: AdoWorkItemOptionDto[];
  pbiGroups: WorkItemsByStateGroup[];
  workItemFilters: WorkItemFilters;
  workItemStates: string[];
  workItemsTotalCount: number;
  workItemsFilteredCount: number;
  projectsLoading: boolean;
  teamsLoading: boolean;
  sprintsLoading: boolean;
  pbisLoading: boolean;
  projectsError: string | null;
  teamsError: string | null;
  sprintsError: string | null;
  pbisError: string | null;
  teamMembers: AdoTeamMemberDto[];
  teamMembersLoading: boolean;
  teamMembersError: string | null;
  taskStates: AdoTaskStateDto[];
  taskStatesLoading: boolean;
  taskStatesError: string | null;
  defaultOpenTaskState: string | null;
  catalogDisabled: boolean;
  projectSelectDisabled: boolean;
  teamSelectDisabled: boolean;
  sprintSelectDisabled: boolean;
  pbiSelectDisabled: boolean;
  placeholders: TimeLogCatalogPlaceholders;
  selectedSprintLabel: string | null;
  selectedPbi: AdoWorkItemOptionDto | null;
  onProjectChange: () => void;
  onTeamChange: () => void;
  onSprintChange: () => void;
  onWorkItemSearchChange: (value: string) => void;
  onWorkItemAssigneeChange: (value: string) => void;
  onWorkItemStateChange: (value: string) => void;
};

export type TimeLogStep = 1 | 2;
