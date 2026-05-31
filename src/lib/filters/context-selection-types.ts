import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogCatalogPlaceholders } from "@/lib/time-log/catalog-types";

/** Props compartidas por los selects de proyecto / equipo / sprint. */
export type AdoContextSelectFieldsProps = {
  project: string;
  team: string;
  sprintPath: string;
  projects: AdoProjectDto[];
  teams: AdoTeamDto[];
  sprints: AdoSprintDto[];
  placeholders: Pick<TimeLogCatalogPlaceholders, "project" | "team" | "sprint">;
  selectedSprintLabel: string | null;
  projectSelectDisabled: boolean;
  teamSelectDisabled: boolean;
  sprintSelectDisabled: boolean;
  projectsError: string | null;
  teamsError: string | null;
  sprintsError: string | null;
  onProjectChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onSprintChange: (value: string) => void;
  defaultProject?: string | null;
  defaultTeam?: string | null;
  saveDefaultsPending?: boolean;
  onSaveDefaults?: () => void | Promise<void>;
  /** Filtro opcional (p. ej. día del sprint) junto al select de sprint. */
  sprintDayFilter?: React.ReactNode;
  /** Muestra asterisco rojo en las etiquetas de proyecto, equipo y sprint. */
  markRequiredFields?: boolean;
  className?: string;
};
