"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import type { AdoProjectDto } from "@/lib/schemas/ado-catalog";

export type ReportsTimeLogExportProjectsFilterProps = {
  projects: ReadonlyArray<AdoProjectDto>;
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function ReportsTimeLogExportProjectsFilter({
  projects,
  selected,
  onChange,
}: Readonly<ReportsTimeLogExportProjectsFilterProps>) {
  const options = projects.map((p) => ({ value: p.name, label: p.name }));
  const triggerLabel =
    selected.length === 0
      ? "Todos los proyectos"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} proyectos seleccionados`;
  return (
    <MultiCheckboxFilter
      id="export-projects"
      label="Proyectos"
      options={options}
      selected={selected}
      onSelectedChange={onChange}
      triggerLabel={triggerLabel}
      disabled={options.length === 0}
    />
  );
}