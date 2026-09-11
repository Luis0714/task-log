"use client";

import { FilterAddChip } from "@/components/filters/filter-add-chip";
import { FilterChipGroup } from "@/components/filters/filter-chip-group";
import { FilterSectionLabel } from "@/components/filters/filter-section-label";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import {
  ANY_FILTER_VALUE,
  ME_FILTER_VALUE,
  isPullRequestFilterStatus,
  type PullRequestFilterState,
} from "@/lib/pull-requests/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activo", dotClassName: "bg-amber-500" },
  { value: "approved", label: "Aprobado", dotClassName: "bg-emerald-500" },
  { value: "changes_requested", label: "Con cambios", dotClassName: "bg-destructive" },
  { value: "draft", label: "Borrador", dotClassName: "bg-muted-foreground" },
] as const;

export type PullRequestFiltersFormProps = {
  filters: PullRequestFilterState;
  projects: readonly string[];
  repositories: readonly string[];
  authors: readonly string[];
  onChange: (next: PullRequestFilterState) => void;
};

export function PullRequestFiltersForm({
  filters,
  projects,
  repositories,
  authors,
  onChange,
}: PullRequestFiltersFormProps) {
  const authorOptions = [
    { value: ANY_FILTER_VALUE, label: "Cualquiera" },
    ...authors.map((author) => ({ value: author, label: author })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-2">
        <FilterSectionLabel>Proyecto</FilterSectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <FilterChipGroup
            mode="multiple"
            options={projects.map((project) => ({ value: project, label: project }))}
            value={filters.projects}
            onValueChange={(projects) => onChange({ ...filters, projects })}
          />
          <FilterAddChip />
        </div>
      </section>

      <section className="space-y-2">
        <FilterSectionLabel>Repositorio</FilterSectionLabel>
        <FilterChipGroup
          mode="multiple"
          options={repositories.map((repository) => ({
            value: repository,
            label: repository,
          }))}
          value={filters.repositories}
          onValueChange={(repositories) => onChange({ ...filters, repositories })}
        />
      </section>

      <section className="space-y-2">
        <FilterSectionLabel>Estado del PR</FilterSectionLabel>
        <FilterChipGroup
          mode="single"
          options={STATUS_OPTIONS}
          value={filters.prStatus}
          onValueChange={(prStatus) => {
            if (!isPullRequestFilterStatus(prStatus)) return;
            onChange({ ...filters, prStatus });
          }}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <ControlledSelectField
          label="Autor"
          value={filters.author}
          placeholder="Cualquiera"
          options={authorOptions}
          displayValue={
            filters.author === ANY_FILTER_VALUE ? "Cualquiera" : filters.author
          }
          onValueChange={(author) => onChange({ ...filters, author })}
        />
        <ControlledSelectField
          label="Revisor"
          value={filters.reviewer}
          placeholder="Cualquiera"
          options={[
            { value: ANY_FILTER_VALUE, label: "Cualquiera" },
            { value: ME_FILTER_VALUE, label: "Tú (asignado)" },
          ]}
          displayValue={
            filters.reviewer === ME_FILTER_VALUE ? "Tú (asignado)" : "Cualquiera"
          }
          onValueChange={(reviewer) => onChange({ ...filters, reviewer })}
        />
      </div>
    </div>
  );
}
