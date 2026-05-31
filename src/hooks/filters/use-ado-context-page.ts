"use client";

import { useMemo } from "react";

import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCatalogError } from "@/lib/ado/resolve-catalog-error";
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";

export type UseAdoContextPageOptions = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  assignee?: string;
  sprintDay?: string;
  workItemsCount?: number;
};

export function useAdoContextPage({
  catalog,
  adoExecutionReady,
  assignee,
  sprintDay,
  workItemsCount = 0,
}: UseAdoContextPageOptions) {
  const context = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    assignee,
    sprintDay,
    workItemsCount,
  });

  const currentSprint = useMemo(() => resolveCurrentSprint(catalog), [catalog]);
  const catalogError = resolveCatalogError(catalog);

  return { context, currentSprint, catalogError };
}
