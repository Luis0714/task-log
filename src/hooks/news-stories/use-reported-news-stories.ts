"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  ReportedNewsDateFilter,
  ReportedNewsDetail,
  ReportedNewsScope,
} from "@/lib/azure-devops/list-reported-news";
import {
  listReportedNews,
  type NewsStoriesServiceResult,
} from "@/services/news-stories/news-stories.service";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Mes actual en formato `YYYY-MM`. Misma convención que el módulo de
 *  asignaciones para mantener consistencia entre secciones de la app. */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Valida que un string sea un mes `YYYY-MM` válido. */
export function isValidMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value.trim());
}

/** Valida que un string sea una fecha `YYYY-MM-DD` válida. */
export function isValidDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value.trim());
}

export type UseReportedNewsStoriesArgs = Readonly<{
  /** Universo multi-scope (proyectos × equipos) sobre el que se buscan novedades. */
  scopes: ReadonlyArray<ReportedNewsScope>;
}>;

export type UseReportedNewsStoriesResult = Readonly<{
  items: ReadonlyArray<ReportedNewsDetail>;
  loading: boolean;
  error: string | null;
  /** Recarga manual tras cambios en (proyectos, equipos) o filtro de fecha. */
  refresh: () => Promise<void>;
}>;

/**
 * Hook que orquesta la lista de novedades reportadas en las HUs vinculadas
 * para un universo multi-scope. Encapsula el fetch + estado efímero; la lógica
 * de negocio vive en `lib/azure-devops/list-reported-news.ts`.
 *
 * Acepta un `dateFilter` unificado (mes / rango / none). No dispara fetch si
 * no hay scopes.
 */
export function useReportedNewsStories(
  args: UseReportedNewsStoriesArgs,
  dateFilter: ReportedNewsDateFilter | null,
): UseReportedNewsStoriesResult {
  const [items, setItems] = useState<ReadonlyArray<ReportedNewsDetail>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(async () => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (args.scopes.length === 0 || !isValidDateFilter(dateFilter)) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      const result: NewsStoriesServiceResult<ReportedNewsDetail[]> =
        await listReportedNews({
          scopes: args.scopes.map((s) => ({
            project: s.projectId,
            team: s.teamId,
          })),
          dateFilter: dateFilter ?? { kind: "none" },
        });
      if (controller.signal.aborted) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setItems([]);
        return;
      }
      setItems(result.value);
    })();

    return () => controller.abort();
  }, [args.scopes, dateFilter, nonce]);

  return { items, loading, error, refresh };
}

function isValidDateFilter(filter: ReportedNewsDateFilter | null): boolean {
  if (!filter) return false;
  if (filter.kind === "none") return true;
  if (filter.kind === "month") return isValidMonthKey(filter.monthKey);
  return isValidDateKey(filter.fromKey) && isValidDateKey(filter.toKey);
}
