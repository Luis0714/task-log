"use client";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import type { FormSelectOption } from "@/components/time-log/fields/controlled-select-field";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type {
  AssignmentsContextSelection,
} from "@/hooks/assignments/use-assignments-context-url";

const NO_VALUE = "__none__";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function monthOptions(currentYear: number): FormSelectOption[] {
  const out: FormSelectOption[] = [];
  for (let m = 1; m <= 12; m++) {
    const value = `${currentYear}-${String(m).padStart(2, "0")}`;
    out.push({ value, label: `${MONTH_NAMES[m - 1]} ${currentYear}`, key: value });
  }
  return out;
}

function PlaceholderSpan({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="text-muted-foreground">{children}</span>;
}

export type AssignmentsContextFieldsProps = {
  catalog: AdoCatalogSnapshot;
  selection: AssignmentsContextSelection;
  onProjectChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onMonthChange: (value: string) => void;
};

export function AssignmentsContextFields({
  catalog,
  selection,
  onProjectChange,
  onTeamChange,
  onMonthChange,
}: AssignmentsContextFieldsProps) {
  const projectOptions: FormSelectOption[] = catalog.projects.map((p) => ({
    value: p.name,
    label: p.name,
    key: p.name,
  }));
  const teamOptions: FormSelectOption[] = catalog.teams.map((t) => ({
    value: t.name,
    label: t.name,
    key: t.name,
  }));

  const currentYear = new Date().getFullYear();
  const monthList = monthOptions(currentYear);

  const projectLabel =
    catalog.projects.find((p) => p.name === selection.project)?.name ?? null;
  const teamLabel =
    catalog.teams.find((t) => t.name === selection.team)?.name ?? null;
  const monthLabel: string | null =
    monthList.find((m) => m.value === selection.month)?.label != null
      ? String(monthList.find((m) => m.value === selection.month)?.label)
      : null;

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ControlledSelectField
        label="Proyecto"
        value={selection.project || NO_VALUE}
        placeholder="Selecciona un proyecto"
        options={projectOptions}
        disabled={catalog.errors.projects !== null}
        error={catalog.errors.projects}
        displayValue={
          projectLabel ?? (
            <PlaceholderSpan>
              {catalog.errors.projects ? "Sin proyectos" : "Selecciona un proyecto"}
            </PlaceholderSpan>
          )
        }
        triggerTitle={projectLabel ?? undefined}
        onValueChange={(value) => {
          if (value === NO_VALUE) return;
          onProjectChange(value);
        }}
      />

      <ControlledSelectField
        label="Equipo"
        value={selection.team || NO_VALUE}
        placeholder="Selecciona un equipo"
        options={teamOptions}
        disabled={!selection.project || catalog.errors.teams !== null}
        error={catalog.errors.teams}
        displayValue={
          teamLabel ?? (
            <PlaceholderSpan>
              {catalog.errors.teams
                ? "Sin equipos"
                : !selection.project
                  ? "Selecciona un proyecto primero"
                  : "Selecciona un equipo"}
            </PlaceholderSpan>
          )
        }
        triggerTitle={teamLabel ?? undefined}
        itemTextWrap
        onValueChange={(value) => {
          if (value === NO_VALUE) return;
          onTeamChange(value);
        }}
      />

      <ControlledSelectField
        label="Mes"
        value={selection.month || monthList[0].value}
        placeholder="Mes del año actual"
        options={monthList}
        displayValue={
          monthLabel ?? <PlaceholderSpan>Selecciona un mes</PlaceholderSpan>
        }
        triggerTitle={monthLabel ?? undefined}
        onValueChange={(value) => {
          if (value === NO_VALUE) return;
          onMonthChange(value);
        }}
      />
    </div>
  );
}
