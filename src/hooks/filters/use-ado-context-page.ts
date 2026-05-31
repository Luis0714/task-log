"use client";

import { useMemo } from "react";

import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import { useSaveAdoContextDefaults } from "@/hooks/filters/use-save-ado-context-defaults";
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
  const contextUrl = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    assignee,
    sprintDay,
    workItemsCount,
  });

  const { refreshContext, ...contextFields } = contextUrl;

  const defaults = useSaveAdoContextDefaults({
    catalog,
    onSaved: refreshContext,
  });

  const context = useMemo(
    () => ({
      ...contextFields,
      defaultProject: defaults.defaultProject,
      defaultTeam: defaults.defaultTeam,
      saveDefaultsPending: defaults.saveDefaultsPending,
      onSaveDefaults: defaults.saveDefaults,
    }),
    [contextFields, defaults],
  );

  const currentSprint = useMemo(() => resolveCurrentSprint(catalog), [catalog]);
  const catalogError = resolveCatalogError(catalog);

  return { context, currentSprint, catalogError };
}
