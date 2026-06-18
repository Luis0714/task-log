"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { saveAdoContextDefaultsRequest } from "@/services/ado/ado-context-defaults.service";
import { saveFilterPreferences } from "@/services/user/filter-preferences.service";
import { appToast } from "@/lib/toast/app-toast";
import type { UserFilterScope } from "@/lib/db/ports/user-filter-preferences.repository.port";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export type UseSavePageDefaultsOptions = {
  project: string;
  team: string;
  scope: UserFilterScope;
  filters: WorkItemFilters;
};

/**
 * Guarda en un solo clic el proyecto y equipo como defaults globales
 * y los filtros de work-items del scope actual.
 */
export function useSavePageDefaults({
  project,
  team,
  scope,
  filters,
}: UseSavePageDefaultsOptions) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  const save = useCallback(async () => {
    if (!project || !team || inFlightRef.current) return;
    inFlightRef.current = true;
    setPending(true);
    try {
      await Promise.all([
        saveAdoContextDefaultsRequest({ project, team }),
        saveFilterPreferences(scope, filters),
      ]);
      appToast.success("Proyecto, equipo y filtros guardados como predeterminados.");
      router.refresh();
    } catch (cause) {
      appToast.fromError(cause, "No se pudieron guardar los valores predeterminados.");
      throw cause;
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, [project, team, scope, filters, router]);

  return { save, pending };
}
