"use client";

import type { ReactNode } from "react";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import type {
  MultiCheckboxFilterOption,
} from "@/components/filters/multi-checkbox-filter";

export type NewsStoriesScopeFiltersValue = Readonly<{
  selectedProjects: ReadonlyArray<string>;
  selectedTeams: ReadonlyArray<string>;
}>;

export type NewsStoriesScopeFiltersProps = Readonly<{
  value: NewsStoriesScopeFiltersValue;
  onChange: (next: NewsStoriesScopeFiltersValue) => void;
  projects: ReadonlyArray<string>;
  teams: ReadonlyArray<string>;
  /** Deshabilita los filtros (p.ej. hasta que llegue el catálogo). */
  disabled?: boolean;
}>;

function describeSelection(
  selected: ReadonlyArray<string>,
  noun: "proyecto" | "equipo",
): string {
  if (selected.length === 0) return `Todos los ${noun}s`;
  if (selected.length === 1) return selected[0]!;
  return `${selected.length} ${noun}s seleccionados`;
}

export function NewsStoriesScopeFilters({
  value,
  onChange,
  projects,
  teams,
  disabled = false,
}: NewsStoriesScopeFiltersProps): ReactNode {
  const projectOptions: MultiCheckboxFilterOption[] = projects.map((name) => ({
    value: name,
    label: name,
  }));
  const teamOptions: MultiCheckboxFilterOption[] = teams.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[calc(50%-0.375rem)] lg:w-1/2">
        <MultiCheckboxFilter
          id="news-scope-projects"
          label="Proyectos"
          options={projectOptions}
          selected={value.selectedProjects as string[]}
          onSelectedChange={(projects) =>
            onChange({ ...value, selectedProjects: projects })
          }
          triggerLabel={describeSelection(value.selectedProjects, "proyecto")}
          disabled={disabled || projectOptions.length === 0}
        />
      </div>

      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[calc(50%-0.375rem)] lg:w-1/2">
        <MultiCheckboxFilter
          id="news-scope-teams"
          label="Equipos"
          options={teamOptions}
          selected={value.selectedTeams as string[]}
          onSelectedChange={(teams) => onChange({ ...value, selectedTeams: teams })}
          triggerLabel={describeSelection(value.selectedTeams, "equipo")}
          disabled={disabled || teamOptions.length === 0}
        />
      </div>
    </div>
  );
}
