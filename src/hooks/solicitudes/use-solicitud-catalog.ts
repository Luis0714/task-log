"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchSolicitudOptions } from "@/services/solicitudes/solicitudes.service";
import type { SolicitudOptions } from "@/lib/novedades/solicitud-options";

/**
 * Carga las opciones dependientes del proyecto (HUs de novedades, miembros y
 * tipos). Se recarga al cambiar de proyecto y expone `reload` para reintentar
 * (FE-02). Errores se exponen como `error` para que la UI los muestre.
 */
export type SolicitudCatalogState = Readonly<{
  options: SolicitudOptions | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}>;

export function useSolicitudCatalog(project: string): SolicitudCatalogState {
  const [options, setOptions] = useState<SolicitudOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Sin proyecto no hay nada que cargar; el estado inicial ya es vacío y la
    // UI siempre selecciona un proyecto antes de usar estas opciones.
    if (!project) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSolicitudOptions(project)
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setOptions(null);
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar las opciones.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { options, loading, error, reload };
}
