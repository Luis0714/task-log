"use client";

import type { ReactNode } from "react";

import { AdoFilteredPageShell } from "@/components/filters/ado-filtered-page-shell";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";
import { USER_FILTER_SCOPES, type UserFilterScope } from "@/lib/filters/user-filter-scopes";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

const PAGE_COPY: Record<
  SprintItemsKind,
  { title: string; description: string }
> = {
  bugs: {
    title: "Bugs",
    description: "Bugs asignados al sprint actual, con filtros por asignación, estado y fecha.",
  },
  tasks: {
    title: "Tareas",
    description: "Tareas asignadas al sprint actual, con filtros por asignación, estado y día de trabajo.",
  },
};

const SCOPE_BY_KIND: Record<SprintItemsKind, UserFilterScope> = {
  bugs: USER_FILTER_SCOPES.bugs,
  tasks: USER_FILTER_SCOPES.tasks,
};

export type SprintItemsPageShellProps = Readonly<{
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  nonWorkingDates: readonly string[];
  adoExecutionReady: boolean;
  headerAction?: ReactNode;
  children?: ReactNode;
}>;

export function SprintItemsPageShell({
  kind,
  catalog,
  filterMeta,
  nonWorkingDates,
  adoExecutionReady,
  headerAction,
  children = null,
}: SprintItemsPageShellProps) {
  const copy = PAGE_COPY[kind];

  return (
    <AdoFilteredPageShell
      title={copy.title}
      description={copy.description}
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={adoExecutionReady}
      headerAction={headerAction}
      sprintDayFilter
      nonWorkingDates={nonWorkingDates}
      scope={SCOPE_BY_KIND[kind]}
    >
      {children}
    </AdoFilteredPageShell>
  );
}
