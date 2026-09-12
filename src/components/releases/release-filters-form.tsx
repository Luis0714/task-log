"use client";

import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import {
  RELEASE_FILTER_ANY_BRANCH,
  RELEASE_FILTER_ANY_ENVIRONMENT,
  RELEASE_FILTER_ANY_PERSON,
  RELEASE_FILTER_ANY_STATUS,
} from "@/lib/releases/copy";
import type { ReleaseFiltersFormModel } from "@/lib/releases/filter-form-model";
import { ALL_RELEASE_FILTER_VALUE } from "@/lib/releases/filters";
import { RELEASE_STAGE_STATUS_LABEL } from "@/lib/releases/stage-status";
import { RELEASE_STAGE_STATUSES } from "@/lib/releases/types";

export function ReleaseFiltersForm({
  filters,
  options,
  onChange,
}: ReleaseFiltersFormModel) {
  const createdByOptions = [
    { value: ALL_RELEASE_FILTER_VALUE, label: RELEASE_FILTER_ANY_PERSON },
    ...options.createdBy.map((name) => ({ value: name, label: name })),
  ];
  const branchOptions = [
    { value: ALL_RELEASE_FILTER_VALUE, label: RELEASE_FILTER_ANY_BRANCH },
    ...options.branches.map((name) => ({ value: name, label: name })),
  ];
  const environmentOptions = [
    { value: ALL_RELEASE_FILTER_VALUE, label: RELEASE_FILTER_ANY_ENVIRONMENT },
    ...options.environments.map((name) => ({ value: name, label: name })),
  ];
  const statusOptions = [
    { value: ALL_RELEASE_FILTER_VALUE, label: RELEASE_FILTER_ANY_STATUS },
    ...RELEASE_STAGE_STATUSES.map((status) => ({
      value: status,
      label: RELEASE_STAGE_STATUS_LABEL[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <ControlledSelectField
        label="Creado por"
        value={filters.createdBy}
        placeholder={RELEASE_FILTER_ANY_PERSON}
        options={createdByOptions}
        displayValue={
          filters.createdBy === ALL_RELEASE_FILTER_VALUE
            ? RELEASE_FILTER_ANY_PERSON
            : filters.createdBy
        }
        onValueChange={(createdBy) => onChange({ ...filters, createdBy })}
      />
      <ControlledSelectField
        label="Rama"
        value={filters.branch}
        placeholder={RELEASE_FILTER_ANY_BRANCH}
        options={branchOptions}
        displayValue={
          filters.branch === ALL_RELEASE_FILTER_VALUE
            ? RELEASE_FILTER_ANY_BRANCH
            : filters.branch
        }
        onValueChange={(branch) => onChange({ ...filters, branch })}
      />
      <ControlledSelectField
        label="Ambiente"
        value={filters.environment}
        placeholder={RELEASE_FILTER_ANY_ENVIRONMENT}
        options={environmentOptions}
        displayValue={
          filters.environment === ALL_RELEASE_FILTER_VALUE
            ? RELEASE_FILTER_ANY_ENVIRONMENT
            : filters.environment
        }
        onValueChange={(environment) => onChange({ ...filters, environment })}
      />
      <ControlledSelectField
        label="Estado"
        value={filters.status}
        placeholder={RELEASE_FILTER_ANY_STATUS}
        options={statusOptions}
        displayValue={
          filters.status === ALL_RELEASE_FILTER_VALUE
            ? RELEASE_FILTER_ANY_STATUS
            : RELEASE_STAGE_STATUS_LABEL[
                filters.status as keyof typeof RELEASE_STAGE_STATUS_LABEL
              ] ?? RELEASE_FILTER_ANY_STATUS
        }
        onValueChange={(status) => onChange({ ...filters, status })}
      />
    </div>
  );
}
