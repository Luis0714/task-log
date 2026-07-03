"use client";

import { useCallback, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { appToast } from "@/lib/toast/app-toast";
import { saveAdoContextDefaultsRequest } from "@/services/ado/ado-context-defaults.service";

export type UseSaveAdoContextDefaultsOptions = {
  catalog: AdoCatalogSnapshot;
  onSaved?: () => void;
};

export function useSaveAdoContextDefaults({
  catalog,
  onSaved,
}: UseSaveAdoContextDefaultsOptions) {
  const [pending, setPending] = useState(false);

  const saveDefaults = useCallback(async () => {
    if (!catalog.project || !catalog.team || pending) return;

    setPending(true);
    try {
      await saveAdoContextDefaultsRequest({
        project: catalog.project,
        team: catalog.team,
      });
      appToast.success(
        "Proyecto y equipo predeterminados guardados. Se aplicarán al abrir la app y en todos los filtros.",
      );
      onSaved?.();
    } catch (cause) {
      appToast.fromError(cause, "No se pudo guardar la conexión predeterminada.");
      throw cause;
    } finally {
      setPending(false);
    }
  }, [catalog.project, catalog.team, onSaved, pending]);

  return {
    defaultProject: catalog.defaultProject,
    defaultTeam: catalog.defaultTeam,
    saveDefaults,
    saveDefaultsPending: pending,
  };
}
