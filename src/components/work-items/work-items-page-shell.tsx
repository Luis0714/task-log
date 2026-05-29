"use client";

import type { ReactNode } from "react";

import { AdoFilteredPageShell } from "@/components/filters/ado-filtered-page-shell";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";

export type WorkItemsPageShellProps = {
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  adoExecutionReady: boolean;
  children?: ReactNode;
};

export function WorkItemsPageShell({
  catalog,
  filterMeta,
  adoExecutionReady,
  children = null,
}: WorkItemsPageShellProps) {
  return (
    <AdoFilteredPageShell
      title="Historias de usuario"
      description="Historias de usuario del sprint actual, con filtros por estado, nombre, asignación y sprint."
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={adoExecutionReady}
    >
      {children}
    </AdoFilteredPageShell>
  );
}
