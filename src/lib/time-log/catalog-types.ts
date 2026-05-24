import type { AdoProjectDto, AdoSprintDto, AdoTeamDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

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
  onWorkItemAssignedToMeChange: (value: boolean) => void;
  onWorkItemStateChange: (value: string) => void;
};

export type TimeLogStep = 1 | 2;
