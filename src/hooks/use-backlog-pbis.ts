"use client";

import { useEffect, useState } from "react";

import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type UseBacklogPbisArgs = Readonly<{
  project?: string | null;
  team?: string | null;
}>;

/**
 * Historias de usuario (PBIs / HUs) del backlog del proyecto activo.
 *
 * Acepta `project` (y opcionalmente `team`) para que el endpoint devuelva el
 * backlog del proyecto seleccionado (no del proyecto por defecto del caller).
 * Si el proyecto o el equipo cambian, el hook refetchea automáticamente.
 *
 * Replica el alcance del "Backlog completo" del formulario de time-log:
 * lista las historias del `backlogItemType` configurado en el proyecto
 * (hasta `BACKLOG_ITEMS_LIMIT` en el servidor) sin filtros de asignado ni
 * sprint. El filtro de equipo se traduce en `[System.AreaPath] UNDER <team>`
 * en el backend.
 *
 * Cache módulo-level (TTL 5 min) + dedup de requests en vuelo: si dos
 * componentes piden el backlog del mismo (proyecto, equipo), comparten UNA
 * sola fetch. **No llamar con `project === ""`** — eso cae en el slot
 * `__default__` y cruzaría proyectos; pasar `null` para desactivar el fetch.
 */
export function useBacklogPbis(args?: UseBacklogPbisArgs | string | null): {
  pbis: readonly AdoWorkItemOptionDto[];
  loading: boolean;
} {
  const { project, team } = normalizeArgs(args);

  const [pbis, setPbis] = useState<readonly AdoWorkItemOptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (project === null) {
      setPbis([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchBacklogPbis(project, team)
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
  }, [project, team]);

  return { pbis, loading };
}

/**
 * Acepta tanto la firma nueva `{ project, team }` como la legacy `project`
 * (string | null) para no romper `BulkReassignParentTasksDialog`. Si llega
 * `null`, devuelve `project = null` (no fetch).
 */
function normalizeArgs(
  args?: UseBacklogPbisArgs | string | null,
): { project: string | null; team: string | null } {
  if (args === undefined || args === null) {
    return { project: null, team: null };
  }
  if (typeof args === "string") {
    return {
      project: args.trim().length > 0 ? args : null,
      team: null,
    };
  }
  const projectRaw = args.project ?? null;
  const teamRaw = args.team ?? null;
  return {
    project: typeof projectRaw === "string" && projectRaw.trim().length > 0 ? projectRaw : null,
    team: typeof teamRaw === "string" && teamRaw.trim().length > 0 ? teamRaw : null,
  };
}

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: AdoWorkItemOptionDto[]; expiresAt: number }>();
const inFlight = new Map<string, Promise<AdoWorkItemOptionDto[]>>();

function keyOf(project: string, team: string | null): string {
  // Equivalente a `${project}@@${team ?? ""}` — explícito y fácil de leer en
  // logs. El par se trata como una unidad: cambiar el equipo aunque el
  // proyecto sea el mismo siempre trae un refetch.
  return `${project}@@${team ?? ""}`;
}

async function fetchBacklogPbis(
  project: string,
  team: string | null,
): Promise<AdoWorkItemOptionDto[]> {
  const key = keyOf(project, team);

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = inFlight.get(key);
  if (pending !== undefined) return pending;

  const params = new URLSearchParams({ project });
  if (team) params.set("team", team);

  const promise = (async () => {
    try {
      const res = await fetch(`/api/ado/backlog-items?${params.toString()}`, {
        cache: "no-store",
      });
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