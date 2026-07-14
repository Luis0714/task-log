"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { WorkItemAssigneeFilter } from "@/components/filters/work-item-assignee-filter";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type SolicitudesFiltersBarProps = Readonly<{
  /** Lista de proyectos disponibles (origen: catálogo de la página). */
  projects: readonly string[];
  /** IDs de proyectos seleccionados (`[]` = todos). */
  selectedProjectIds: readonly string[];
  onProjectIdsChange: (ids: string[]) => void;

  /** Equipos del proyecto activo (origen: `useSolicitudCatalog`). */
  teams: readonly string[];
  /** IDs de equipos seleccionados (`[]` = todos). */
  selectedTeamIds: readonly string[];
  onTeamIdsChange: (ids: string[]) => void;

  /** Filtro de asignado (formato estándar "all" / "me" / `name|name|...`). */
  assigneeValue: string;
  onAssigneeChange: (value: string) => void;

  /** Miembros del proyecto para alimentar el filtro de asignado. */
  members: AdoTeamMemberDto[];
  membersLoading?: boolean;
  membersError?: string | null;
}>;

const ALL_LABEL = "Todos";
const PROJECT_NOUN = "proyectos seleccionados";
const TEAM_NOUN = "equipos seleccionados";

function selectionLabel(
  selected: readonly string[],
  countedNoun: string,
): string {
  if (selected.length === 0) return ALL_LABEL;
  if (selected.length === 1) return selected[0];
  return `${selected.length} ${countedNoun}`;
}

/**
 * Filtros del listado "Mis solicitudes": multi-select de proyectos y equipos
 * (mismo patrón que el reporte de horas por periodo) + filtro de asignado con
 * "Yo / Todos / personas específicas" (mismo patrón que time-log).
 *
 * Por defecto todo está sin restringir: el usuario ve sus solicitudes de todos
 * los proyectos/equipos y solo filtrará si lo necesita.
 */
export function SolicitudesFiltersBar({
  projects,
  selectedProjectIds,
  onProjectIdsChange,
  teams,
  selectedTeamIds,
  onTeamIdsChange,
  assigneeValue,
  onAssigneeChange,
  members,
  membersLoading = false,
  membersError = null,
}: SolicitudesFiltersBarProps) {
  const projectOptions = projects.map((project) => ({ value: project, label: project }));
  const teamOptions = teams.map((team) => ({ value: team, label: team }));

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <MultiCheckboxFilter
        id="solicitudes-projects"
        label="Proyectos"
        options={projectOptions}
        selected={[...selectedProjectIds]}
        onSelectedChange={onProjectIdsChange}
        triggerLabel={selectionLabel(selectedProjectIds, PROJECT_NOUN)}
        disabled={projectOptions.length === 0}
      />
      <MultiCheckboxFilter
        id="solicitudes-teams"
        label="Equipos"
        options={teamOptions}
        selected={[...selectedTeamIds]}
        onSelectedChange={onTeamIdsChange}
        triggerLabel={selectionLabel(selectedTeamIds, TEAM_NOUN)}
        disabled={teamOptions.length === 0}
      />
      <WorkItemAssigneeFilter
        id="solicitudes-assignee"
        assignee={assigneeValue}
        members={members}
        membersLoading={membersLoading}
        membersError={membersError}
        onAssigneeChange={onAssigneeChange}
      />
    </div>
  );
}
