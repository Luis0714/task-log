import type { AdoCatalogSnapshot, AdoContextFields } from "@/lib/ado/types";
import { buildCatalogPlaceholders } from "@/lib/time-log/catalog-placeholders";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

export function catalogToContextFields(
  catalog: AdoCatalogSnapshot,
  options: { adoExecutionReady: boolean; workItemsCount?: number },
): AdoContextFields {
  const currentSprint = catalog.sprints.find((sprint) => sprint.path === catalog.sprintPath) ?? null;
  const placeholders = buildCatalogPlaceholders({
    adoExecutionReady: options.adoExecutionReady,
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    projectsLoading: false,
    teamsLoading: false,
    sprintsLoading: false,
    pbisLoading: false,
    teamsCount: catalog.teams.length,
    sprintsCount: catalog.sprints.length,
    pbisCount: options.workItemsCount ?? 0,
    filteredPbisCount: options.workItemsCount ?? 0,
  });

  return {
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    projects: catalog.projects,
    teams: catalog.teams,
    sprints: catalog.sprints,
    placeholders,
    selectedSprintLabel: currentSprint ? formatSprintOptionLabel(currentSprint) : null,
    projectSelectDisabled: !options.adoExecutionReady,
    teamSelectDisabled: !catalog.project,
    sprintSelectDisabled: !catalog.team,
    projectsError: catalog.errors.projects,
    teamsError: catalog.errors.teams,
    sprintsError: catalog.errors.sprints,
  };
}
