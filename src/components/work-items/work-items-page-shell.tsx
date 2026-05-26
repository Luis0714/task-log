"use client";

import type { ReactNode } from "react";

import { AdoFilteredPageShell } from "@/components/filters/ado-filtered-page-shell";
import {
  WorkItemsFiltersProvider,
} from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";

export type WorkItemsPageShellProps = {
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  adoExecutionReady: boolean;
  urlAssignee: string;
  currentUserDisplayName?: string | null;
  children?: ReactNode;
};

export function WorkItemsPageShell({
  catalog,
  filterMeta,
  adoExecutionReady,
  urlAssignee,
  currentUserDisplayName: _currentUserDisplayName,
  children = null,
}: WorkItemsPageShellProps) {
  return (
    <WorkItemsFiltersProvider initialAssignee={urlAssignee}>
      <AdoFilteredPageShell
        title="Work Items"
        description="Historias del sprint con filtros por estado, nombre y asignación."
        notReadyMessage="Conecta Azure DevOps para ver las historias de usuario del sprint."
        catalog={catalog}
        filterMeta={filterMeta}
        adoExecutionReady={adoExecutionReady}
      >
        {children}
      </AdoFilteredPageShell>
    </WorkItemsFiltersProvider>
  );
}
