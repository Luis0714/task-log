"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

/**
 * Historias de usuario (PBIs / HUs) del backlog del proyecto activo.
 *
 * Acepta `project` para que el endpoint devuelva el backlog del proyecto
 * seleccionado (no del proyecto por defecto del caller). Si el proyecto
 * cambia, el hook refetchea automáticamente.
 *
 * Replica el alcance del "Backlog completo" del formulario de time-log:
 * lista las historias del `backlogItemType` configurado en el proyecto
 * (hasta `BACKLOG_ITEMS_LIMIT` en el servidor) sin filtros de asignado,
 * equipo ni sprint.
 *
 * Cache módulo-level (TTL 5 min) + dedup de requests en vuelo: si dos
 * componentes piden el backlog del mismo proyecto, comparten UNA sola fetch.
 */
export function useBacklogPbis(project?: string | null): {
  pbis: readonly AdoWorkItemOptionDto[];
  loading: boolean;
} {
  const [pbis, setPbis] = useState<readonly AdoWorkItemOptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchBacklogPbis(project)
      .then((result) => {
        if (cancelled) return;
        setPbis(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return { pbis, loading };
}

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: AdoWorkItemOptionDto[]; expiresAt: number }>();
const inFlight = new Map<string, Promise<AdoWorkItemOptionDto[]>>();

function keyOf(project: string | null | undefined): string {
  return project?.trim() || "__default__";
}

async function fetchBacklogPbis(
  project: string | null | undefined,
): Promise<AdoWorkItemOptionDto[]> {
  const key = keyOf(project);

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = inFlight.get(key);
  if (pending !== undefined) return pending;

  const url = project
    ? `/api/ado/backlog-items?project=${encodeURIComponent(project)}`
    : "/api/ado/backlog-items";

  const promise = (async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const data = (await res.json()) as { pbis?: AdoWorkItemOptionDto[] };
      const pbis = Array.isArray(data.pbis) ? data.pbis : [];
      cache.set(key, { value: pbis, expiresAt: Date.now() + TTL_MS });
      return pbis;
    } catch {
      return [];
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}