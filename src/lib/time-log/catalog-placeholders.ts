import type { TimeLogCatalogPlaceholders } from "@/lib/time-log/catalog-types";

type BuildPlaceholdersInput = {
  adoExecutionReady: boolean;
  project: string;
  team: string;
  sprintPath: string;
  projectsLoading: boolean;
  teamsLoading: boolean;
  sprintsLoading: boolean;
  pbisLoading: boolean;
  teamsCount: number;
  sprintsCount: number;
  pbisCount: number;
  filteredPbisCount: number;
};

export function buildCatalogPlaceholders(input: BuildPlaceholdersInput): TimeLogCatalogPlaceholders {
  const {
    adoExecutionReady,
    project,
    team,
    sprintPath,
    projectsLoading,
    teamsLoading,
    sprintsLoading,
    pbisLoading,
    teamsCount,
    sprintsCount,
    pbisCount,
    filteredPbisCount,
  } = input;

  return {
    project: projectsLoading
      ? "Cargando proyectos..."
      : adoExecutionReady
        ? "Selecciona un proyecto"
        : "Conecta Azure DevOps para ver proyectos",
    team: !project
      ? "Primero elige un proyecto"
      : teamsLoading
        ? "Cargando equipos..."
        : teamsCount === 0
          ? "Sin equipos en este proyecto"
          : "Selecciona un equipo",
    sprint: !team
      ? "Primero elige un equipo"
      : sprintsLoading
        ? "Cargando sprints..."
        : sprintsCount === 0
          ? "Sin sprints para este equipo"
          : "Selecciona un sprint",
    pbi: !sprintPath
      ? "Primero elige un sprint"
      : pbisLoading
        ? "Cargando historias..."
        : pbisCount === 0
          ? "Sin historias en este sprint"
          : filteredPbisCount === 0
            ? "Sin resultados con estos filtros"
            : "Selecciona una historia (PBI)",
  };
}

export function buildCatalogDisabledState(input: {
  submitting: boolean;
  adoExecutionReady: boolean;
  projectsLoading: boolean;
  teamsLoading: boolean;
  sprintsLoading: boolean;
  pbisLoading: boolean;
  project: string;
  team: string;
  sprintPath: string;
  pbisCount: number;
}) {
  const catalogDisabled = input.submitting || !input.adoExecutionReady;

  return {
    catalogDisabled,
    projectSelectDisabled: catalogDisabled || input.projectsLoading,
    teamSelectDisabled:
      catalogDisabled || !input.project || input.projectsLoading || input.teamsLoading,
    sprintSelectDisabled:
      catalogDisabled ||
      !input.project ||
      !input.team ||
      input.teamsLoading ||
      input.sprintsLoading,
    pbiSelectDisabled:
      catalogDisabled ||
      !input.project ||
      !input.team ||
      !input.sprintPath ||
      input.pbisLoading ||
      input.sprintsLoading ||
      input.pbisCount === 0,
  };
}
