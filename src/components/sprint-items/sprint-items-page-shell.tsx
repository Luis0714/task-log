"use client";

import type { ReactNode } from "react";

import { AdoFilteredPageShell } from "@/components/filters/ado-filtered-page-shell";
import {
  WorkItemsFiltersProvider,
} from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

const PAGE_COPY: Record<
  SprintItemsKind,
  { title: string; description: string; notReadyMessage: string }
> = {
  bugs: {
    title: "Bugs",
    description: "Bugs del sprint con filtros por asignación, estado y fecha.",
    notReadyMessage: "Conecta Azure DevOps para ver los bugs del sprint.",
  },
  tasks: {
    title: "Tasks",
    description: "Tasks del sprint con filtros por asignación, estado y día de trabajo.",
    notReadyMessage: "Conecta Azure DevOps para ver tus tasks del sprint.",
  },
};

export type SprintItemsPageShellProps = {
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  nonWorkingDates: readonly string[];
  adoExecutionReady: boolean;
  urlAssignee: string;
  headerAction?: ReactNode;
  children?: ReactNode;
};

export function SprintItemsPageShell({
  kind,
  catalog,
  filterMeta,
  nonWorkingDates,
  adoExecutionReady,
  urlAssignee,
  headerAction,
  children = null,
}: SprintItemsPageShellProps) {
  const copy = PAGE_COPY[kind];

  return (
    <WorkItemsFiltersProvider initialAssignee={urlAssignee}>
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
    </WorkItemsFiltersProvider>
  );
}
