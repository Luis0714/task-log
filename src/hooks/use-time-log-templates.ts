"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createTimeLogTemplate as createTemplate,
  deleteTimeLogTemplate as deleteTemplate,
  fetchTimeLogTemplates,
  updateTimeLogTemplate as updateTemplate,
} from "@/components/time-log/services/time-log-template.service";
import type {
  CreateTimeLogTemplateBody,
  TimeLogTemplateDto,
} from "@/lib/schemas/time-log-template";

export type UseTimeLogTemplatesResult = {
  templates: TimeLogTemplateDto[];
  loading: boolean;
  error: string | null;
  /** Encuentra la plantilla por id (o `null` si no existe / lista vacía). */
  findById: (id: string | null | undefined) => TimeLogTemplateDto | null;
  create: (
    input: CreateTimeLogTemplateBody,
  ) => Promise<TimeLogTemplateDto | null>;
  remove: (id: string) => Promise<boolean>;
  update: (
    id: string,
    input: CreateTimeLogTemplateBody,
  ) => Promise<TimeLogTemplateDto | null>;
  /** Re-fetch manual (útil después de un cambio que no pasó por create/remove). */
  refresh: () => Promise<void>;
};

/**
 * Store singleton compartido entre todas las instancias del hook en el
 * árbol de componentes. Así, cuando el `SaveAsTemplateDialog` crea una
 * plantilla, la lista del `TemplateSelectField` se actualiza sin tener que
 * re-fetch de la API. Mismo caso para `remove`.
 */
type Listener = () => void;

const store: {
  rows: TimeLogTemplateDto[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  inflight: Promise<TimeLogTemplateDto[]> | null;
  listeners: Set<Listener>;
} = {
  rows: [],
  loading: true,
  loaded: false,
  error: null,
  inflight: null,
  listeners: new Set(),
};

function emit() {
  for (const fn of store.listeners) fn();
}

async function ensureLoaded(): Promise<TimeLogTemplateDto[]> {
  if (store.inflight) return store.inflight;
  store.loading = true;
  store.error = null;
  emit();
  store.inflight = fetchTimeLogTemplates()
    .then((rows) => {
      store.rows = rows;
      store.loaded = true;
      store.error = null;
      return rows;
    })
    .catch((err: unknown) => {
      store.error =
        err instanceof Error ? err.message : "Error cargando plantillas.";
      // Marcamos como cargado para no re-intentar en cada montaje, ya que
      // un 404 (p. ej. en entorno dev sin backend) no se resolverá solo.
      // El usuario puede forzar un reintento con `refresh()`.
      store.loaded = true;
      throw err;
    })
    .finally(() => {
      store.loading = false;
      store.inflight = null;
      emit();
    });
  return store.inflight;
}

export function useTimeLogTemplates(): UseTimeLogTemplatesResult {
  // Suscripción al store compartido para que múltiples componentes vean
  // la misma lista y se enteren de los cambios en tiempo real.
  const [rows, setRows] = useState<TimeLogTemplateDto[]>(store.rows);
  const [loading, setLoading] = useState<boolean>(store.loading);
  const [error, setError] = useState<string | null>(store.error);

  useEffect(() => {
    // El listener dispara una re-sincronización completa del estado local
    // desde el store. Esto es importante para reflejar la transición
    // loading → loaded incluso cuando la carga falla (404 en dev sin
    // backend), ya que antes el esqueleto se quedaba indefinidamente.
    const listener: Listener = () => {
      setRows(store.rows);
      setLoading(store.loading);
      setError(store.error);
    };
    store.listeners.add(listener);
    listener();
    if (!store.loaded && !store.inflight) {
      ensureLoaded().catch(() => {
        // el error ya quedó en `store.error`
      });
    }
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  const findById = useCallback(
    (id: string | null | undefined): TimeLogTemplateDto | null => {
      if (!id) return null;
      return store.rows.find((t) => t.id === id) ?? null;
    },
    [],
  );

  const create = useCallback(
    async (
      input: CreateTimeLogTemplateBody,
    ): Promise<TimeLogTemplateDto | null> => {
      try {
        const created = await createTemplate(input);
        const next = [...store.rows, created].sort((a, b) =>
          a.name.localeCompare(b.name, "es"),
        );
        store.rows = next;
        emit();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos guardar la plantilla.");
        return null;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteTemplate(id);
      store.rows = store.rows.filter((t) => t.id !== id);
      emit();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos eliminar la plantilla.");
      return false;
    }
  }, []);

  const update = useCallback(
    async (
      id: string,
      input: CreateTimeLogTemplateBody,
    ): Promise<TimeLogTemplateDto | null> => {
      try {
        const updated = await updateTemplate(id, input);
        const next = store.rows
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.name.localeCompare(b.name, "es"));
        store.rows = next;
        emit();
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
        return null;
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    store.loaded = false;
    try {
      await ensureLoaded();
    } catch {
      // error en store.error
    }
  }, []);

  return { templates: rows, loading, error, findById, create, remove, update, refresh };
}
