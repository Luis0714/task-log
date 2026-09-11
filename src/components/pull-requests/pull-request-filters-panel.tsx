"use client";

import { PullRequestFiltersForm } from "@/components/pull-requests/pull-request-filters-form";
import type { PullRequestFilterState } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

export type PullRequestFiltersPanelProps = {
  filters: PullRequestFilterState;
  projects: readonly string[];
  repositories: readonly string[];
  authors: readonly string[];
  onChange: (next: PullRequestFilterState) => void;
  className?: string;
};

export function PullRequestFiltersPanel({
  filters,
  projects,
  repositories,
  authors,
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
      <PullRequestFiltersForm
        filters={filters}
        projects={projects}
        repositories={repositories}
        authors={authors}
        onChange={onChange}
      />
    </aside>
  );
}
