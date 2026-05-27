"use client";

import type { ReactNode } from "react";

import { AdoFilteredPageShell } from "@/components/filters/ado-filtered-page-shell";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

const PAGE_COPY: Record<
  SprintItemsKind,
  { title: string; description: string; notReadyMessage: string }
> = {
  bugs: {
    title: "Bugs",
    description: "Bugs asignados al sprint actual, con filtros por asignación, estado y fecha.",
    notReadyMessage: "Conecta Azure DevOps para ver los Bugs del sprint.",
  },
  tasks: {
    title: "Tareas",
    description: "Tareas asignadas al sprint actual, con filtros por asignación, estado y día de trabajo.",
    notReadyMessage: "Conecta Azure DevOps para ver tus tareas del sprint.",
  },
};

export type SprintItemsPageShellProps = {
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  nonWorkingDates: readonly string[];
  adoExecutionReady: boolean;
  headerAction?: ReactNode;
  children?: ReactNode;
};

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
      notReadyMessage={copy.notReadyMessage}
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={adoExecutionReady}
      headerAction={headerAction}
      sprintDayFilter
      nonWorkingDates={nonWorkingDates}
    >
      {children}
    </AdoFilteredPageShell>
  );
}
