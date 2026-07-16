import "server-only";

import type {
  ReportedNewsDateFilter,
  ReportedNewsScope,
} from "@/lib/azure-devops/list-reported-news";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ParseReportedNewsQueryResult =
  | { ok: true; scopes: ReadonlyArray<ReportedNewsScope>; dateFilter: ReportedNewsDateFilter }
  | { ok: false; error: string };

/**
 * Decodifica el universo multi-scope `Proyecto:Equipo|...` desde el query
 * string. Una entrada con equipo vacío (`Proyecto:`) representa el alcance a
 * nivel proyecto (`teamId = null`).
 */
export function parseReportedNewsScopes(
  raw: string | null,
): { ok: true; value: ReadonlyArray<ReportedNewsScope> } | { ok: false; error: string } {
  if (!raw) return { ok: true, value: [] };
  const tokens = raw
    .split("|")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const scopes: ReportedNewsScope[] = [];
  for (const token of tokens) {
    const colonIdx = token.indexOf(":");
    if (colonIdx < 0) {
      return { ok: false, error: `Scope inválido: "${token}"` };
    }
    const project = token.slice(0, colonIdx).trim();
    const team = token.slice(colonIdx + 1).trim();
    if (!project) {
      return { ok: false, error: "Scope sin proyecto." };
    }
    scopes.push({
      projectId: project,
      teamId: team.length === 0 ? null : team,
    });
  }
  return { ok: true, value: scopes };
}

/**
 * Decodifica el filtro de fecha del query string. Si llegan `from` y/o `to`
 * se interpretan como rango inclusivo; si no, `month` como mes civil. Si no
 * llega ninguno, devuelve `{ kind: "none" }` (modo "Todas").
 */
export function parseReportedNewsDateFilter(input: {
  month: string | null;
  from: string | null;
  to: string | null;
}): { ok: true; value: ReportedNewsDateFilter } | { ok: false; error: string } {
  const monthRaw = (input.month ?? "").trim();
  const fromRaw = (input.from ?? "").trim();
  const toRaw = (input.to ?? "").trim();

  if (fromRaw || toRaw) {
    if (!DATE_KEY_PATTERN.test(fromRaw) || !DATE_KEY_PATTERN.test(toRaw)) {
      return {
        ok: false,
        error: "Las fechas del rango deben tener el formato YYYY-MM-DD.",
      };
    }
    if (fromRaw > toRaw) {
      return {
        ok: false,
        error: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'.",
      };
    }
    return {
      ok: true,
      value: { kind: "range", fromKey: fromRaw, toKey: toRaw },
    };
  }
  if (monthRaw) {
    if (!MONTH_KEY_PATTERN.test(monthRaw)) {
      return { ok: false, error: "El mes debe tener el formato YYYY-MM." };
    }
    return { ok: true, value: { kind: "month", monthKey: monthRaw } };
  }
  return { ok: true, value: { kind: "none" } };
}
