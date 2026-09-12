"use client";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import {
  buildPersonFilterOptions,
  personFilterDisplayValue,
} from "@/lib/pull-requests/person-filter-options";
import { ALL_REPOSITORIES_VALUE, ME_FILTER_VALUE } from "@/lib/pull-requests/types";

export function PullRequestFiltersForm({
  filters,
  people,
  repositories,
  onChange,
}: PullRequestFiltersFormModel) {
  const repositoryOptions = [
    { value: ALL_REPOSITORIES_VALUE, label: "Todos los repositorios" },
    ...repositories.names.map((name) => ({ value: name, label: name })),
  ];
  const createdByOptions = buildPersonFilterOptions(people.members);
  const assignedToOptions = buildPersonFilterOptions(people.members, [
    { value: ME_FILTER_VALUE, label: "Tú (asignado)" },
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ControlledSelectField
        label="Repositorio"
        value={filters.repository}
        placeholder="Todos los repositorios"
        options={repositoryOptions}
        loading={repositories.loading}
        displayValue={
          filters.repository === ALL_REPOSITORIES_VALUE
            ? "Todos los repositorios"
            : filters.repository
        }
        onValueChange={(repository) => onChange({ ...filters, repository })}
      />
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
