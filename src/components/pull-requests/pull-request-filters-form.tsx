"use client";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import {
  buildPersonFilterOptions,
  personFilterDisplayValue,
} from "@/lib/pull-requests/person-filter-options";
import { ME_FILTER_VALUE } from "@/lib/pull-requests/types";

export function PullRequestFiltersForm({
  filters,
  people,
  onChange,
}: PullRequestFiltersFormModel) {
  const createdByOptions = buildPersonFilterOptions(people.members);
  const assignedToOptions = buildPersonFilterOptions(people.members, [
    { value: ME_FILTER_VALUE, label: "Tú (asignado)" },
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ControlledSelectField
        label="Creado por"
        value={filters.createdBy}
        placeholder="Cualquiera"
        options={createdByOptions}
        loading={people.membersLoading}
        error={people.membersError}
        emptyMessage="No hay miembros en este equipo."
        displayValue={personFilterDisplayValue(filters.createdBy)}
        onValueChange={(createdBy) => onChange({ ...filters, createdBy })}
      />
      <ControlledSelectField
        label="Asignado a"
        value={filters.assignedTo}
        placeholder="Cualquiera"
        options={assignedToOptions}
        loading={people.membersLoading}
        error={people.membersError}
        emptyMessage="No hay miembros en este equipo."
        displayValue={
          filters.assignedTo === ME_FILTER_VALUE
            ? "Tú (asignado)"
            : personFilterDisplayValue(filters.assignedTo)
        }
        onValueChange={(assignedTo) => onChange({ ...filters, assignedTo })}
      />
    </div>
  );
}
