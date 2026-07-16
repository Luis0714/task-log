"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { WorkItemAssigneeFilter } from "@/components/filters/work-item-assignee-filter";
import {
  type DateFilterMode,
} from "@/components/news-stories/news-stories-reported-format";
import { PeriodInput } from "@/components/news-stories/period-input";
import { PeriodModePicker } from "@/components/news-stories/period-mode-picker";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type SolicitudesFiltersBarProps = Readonly<{
  /** Lista de proyectos disponibles (origen: catálogo de la página). */
  projects: readonly string[];
  /** IDs de proyectos seleccionados (`[]` = todos). */
  selectedProjectIds: readonly string[];
  onProjectIdsChange: (ids: string[]) => void;

  /** Equipos de los proyectos seleccionados (origen: catálogo de la página). */
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
  /** Si es `false`, el campo "Asignación" se queda fijo en "Asignados a mí". */
  isManagement: boolean;

  /** Filtros de periodo (Mes / Rango / Todas). Mismo patrón que el admin de
   *  novedades y el reporte de horas por periodo. */
  mode: DateFilterMode;
  onModeChange: (next: DateFilterMode) => void;
  monthKey: string;
  onMonthKeyChange: (next: string) => void;
  rangeFrom: string;
  rangeTo: string;
  onRangeFromChange: (next: string) => void;
  onRangeToChange: (next: string) => void;
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
 * Filtros del listado "Mis solicitudes": multi-select de proyectos y equipos,
 * filtro de asignado (rol-aware: management = todos, no-management = "Asignados a mí"
 * forzado) y filtros de periodo (Mes / Rango / Todas).
 *
 * El patrón de periodo reusa los componentes del módulo admin/novedades
 * (`PeriodModePicker`, `PeriodInput`) para mantener consistencia visual.
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
  isManagement,
  mode,
  onModeChange,
  monthKey,
  onMonthKeyChange,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
}: SolicitudesFiltersBarProps) {
  const projectOptions = projects.map((project) => ({ value: project, label: project }));
  const teamOptions = teams.map((team) => ({ value: team, label: team }));
  const periodDisabled = projects.length === 0;

  return (
    <div className="space-y-3">
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
          restrictToCurrentUser={!isManagement}
          onAssigneeChange={onAssigneeChange}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Periodo</span>
          <PeriodModePicker mode={mode} onChange={onModeChange} disabled={periodDisabled} />
        </div>
        <PeriodInput
          mode={mode}
          disabled={periodDisabled}
          monthKey={monthKey}
          onMonthKeyChange={onMonthKeyChange}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          onRangeFromChange={onRangeFromChange}
          onRangeToChange={onRangeToChange}
        />
      </div>
    </div>
  );
}
