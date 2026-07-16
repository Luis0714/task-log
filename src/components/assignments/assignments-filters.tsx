"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";

/**
 * Estado de los filtros del módulo de asignaciones.
 * Proyectos/Equipos vacíos = "todos".
 */
export type AssignmentsFiltersValue = {
  personQuery: string;
  projects: string[];
  teams: string[];
};

/** Shape "vacío" usado sólo por la firma; los defaults reales se aplican en shell. */
export type EmptyAssignmentsFiltersShape = Readonly<{
  personQuery: string;
  projects: ReadonlyArray<string>;
  teams: ReadonlyArray<string>;
}>;

export const EMPTY_ASSIGNMENTS_FILTERS: EmptyAssignmentsFiltersShape = {
  personQuery: "",
  projects: [],
  teams: [],
} as const;

/** Construye los filtros iniciales con proyectos/equipos del catálogo por defecto. */
export function buildInitialAssignmentsFilters(
  projectNames: readonly string[],
  teamNames: readonly string[],
): AssignmentsFiltersValue {
  return {
    personQuery: "",
    projects: [...projectNames],
    teams: [...teamNames],
  };
}

export type AssignmentsFiltersProps = Readonly<{
  value: AssignmentsFiltersValue;
  onChange: (next: AssignmentsFiltersValue) => void;
  onClear: () => void;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptions: MultiCheckboxFilterOption[];
  /** Predeterminados del usuario (guardados en sesión). Sirven para saber
   *  cuándo los filtros actuales difieren de los iniciales. */
  defaultProjects: ReadonlyArray<string>;
  defaultTeams: ReadonlyArray<string>;
}>;

function multiTriggerLabel(label: string, selected: readonly string[]): string {
  if (selected.length === 0) return `Todos los ${label}`;
  if (selected.length === 1) return selected[0]!;
  return `${selected.length} ${label} seleccionados`;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((value) => set.has(value));
}

export function AssignmentsFilters({
  value,
  onChange,
  onClear,
  projectOptions,
  teamOptions,
  defaultProjects,
  defaultTeams,
}: AssignmentsFiltersProps) {
  function setPersonQuery(personQuery: string) {
    onChange({ ...value, personQuery });
  }

  function setProjects(projects: string[]) {
    onChange({ ...value, projects });
  }

  function setTeams(teams: string[]) {
    onChange({ ...value, teams });
  }

  const hasAnyFilter = Boolean(
    value.personQuery ||
      !sameSet(value.projects, defaultProjects) ||
      !sameSet(value.teams, defaultTeams),
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap lg:items-end">
      {/* Persona — 30% en desktop. */}
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[calc(50%-0.375rem)] lg:w-[30%]">
        <label
          htmlFor="assignments-filter-person"
          className="text-xs font-medium"
        >
          Persona
        </label>
        <Input
          id="assignments-filter-person"
          value={value.personQuery}
          onChange={(e) => setPersonQuery(e.target.value)}
          placeholder="Buscar por nombre…"
        />
      </div>

      {/* Proyectos — 25% en desktop. */}
      <div className="w-full min-w-0 sm:w-[calc(50%-0.375rem)] lg:w-[25%]">
        <MultiCheckboxFilter
          id="assignments-filter-projects"
          label="Proyectos"
          options={projectOptions}
          selected={value.projects}
          onSelectedChange={setProjects}
          triggerLabel={multiTriggerLabel("proyectos", value.projects)}
        />
      </div>

      {/* Equipos — 25% en desktop. */}
      <div className="w-full min-w-0 sm:w-[calc(50%-0.375rem)] lg:w-[25%]">
        <MultiCheckboxFilter
          id="assignments-filter-teams"
          label="Equipos"
          options={teamOptions}
          selected={value.teams}
          onSelectedChange={setTeams}
          triggerLabel={multiTriggerLabel("equipos", value.teams)}
        />
      </div>

      {/* Limpiar filtros — ocupa el espacio restante; fila propia en mobile. */}
      {hasAnyFilter ? (
        <div className="flex w-full min-w-0 items-end justify-end sm:w-full lg:w-[5%] lg:justify-center">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  aria-label="Limpiar filtros"
                  className="shrink-0 gap-1.5 lg:h-7 lg:w-7 lg:gap-0 lg:px-0"
                />
              }
            >
              <X className="size-3.5" aria-hidden />
              <span className="lg:sr-only">Limpiar filtros</span>
            </TooltipTrigger>
            <TooltipContent>Limpiar filtros</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}
