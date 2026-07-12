"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import type { AdoTeamDto } from "@/lib/schemas/ado-catalog";

export type ReportsTimeLogExportTeamsFilterProps = {
  teams: ReadonlyArray<AdoTeamDto>;
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function ReportsTimeLogExportTeamsFilter({
  teams,
  selected,
  onChange,
}: Readonly<ReportsTimeLogExportTeamsFilterProps>) {
  const options = teams.map((t) => ({ value: t.name, label: t.name }));
  const triggerLabel =
    selected.length === 0
      ? "Todos los equipos"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} equipos seleccionados`;
  return (
    <MultiCheckboxFilter
      id="export-teams"
      label="Equipos"
      options={options}
      selected={selected}
      onSelectedChange={onChange}
      triggerLabel={triggerLabel}
      disabled={options.length === 0}
    />
  );
}