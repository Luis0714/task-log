"use client";

import { PullRequestFiltersForm } from "@/components/pull-requests/pull-request-filters-form";
import type { PullRequestFiltersFormModel } from "@/lib/pull-requests/filter-form-model";
import { cn } from "@/lib/utils";

export type PullRequestFiltersPanelProps = PullRequestFiltersFormModel & {
  className?: string;
};

export function PullRequestFiltersPanel({
  filters,
  people,
  onChange,
  className,
}: PullRequestFiltersPanelProps) {
  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 rounded-xl border bg-card p-4 md:block",
        className,
      )}
    >
      <p className="font-heading mb-4 text-sm font-medium">Filtros</p>
      <PullRequestFiltersForm filters={filters} people={people} onChange={onChange} />
    </aside>
  );
}
