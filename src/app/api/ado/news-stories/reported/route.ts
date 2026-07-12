import "server-only";

import { NextResponse } from "next/server";

import {
  listReportedNews,
  type ReportedNewsDateFilter,
  type ReportedNewsScope,
} from "@/lib/azure-devops/list-reported-news";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Devuelve las novedades reportadas en las HUs vinculadas a un universo
 * multi-scope de `(proyecto, equipo)` configurado por el admin.
 *
 * Filtros de fecha (mutuamente excluyentes; gana `range` si llegan los dos):
 * - `?month=YYYY-MM` — filtra por el mes indicado.
 * - `?from=YYYY-MM-DD&to=YYYY-MM-DD` — filtra por rango explícito.
 * - sin ninguno — modo "Todas".
 *
 * Scopes multi:
 * - `?scopes=ProyectoA:EquipoA|ProyectoA:|ProyectoB:EquipoC` — uno o varios
 *   pares `(proyecto, equipo)` separados por `|`. Un equipo vacío se denota
 *   con `:final` (proyecto-nivel).
 *
 * GET `?scopes=…&[month|range]`
 */
export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, items: [] },
      { status: auth.status },
    );
  }

  const url = new URL(req.url);
  const scopesResult = parseScopes(url.searchParams.get("scopes"));
  if (!scopesResult.ok) {
    return NextResponse.json(
      { error: scopesResult.error, items: [] },
      { status: 400 },
    );
  }
  if (scopesResult.value.length === 0) {
    return NextResponse.json(
      { error: "Falta al menos un (proyecto, equipo) en `scopes`.", items: [] },
      { status: 400 },
    );
  }

  const dateFilterResult = parseDateFilter({
    month: url.searchParams.get("month"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!dateFilterResult.ok) {
    return NextResponse.json(
      { error: dateFilterResult.error, items: [] },
      { status: 400 },
    );
  }

  const adoCaller = await resolveAdoCaller();

  if (!adoCaller) {
    return NextResponse.json(
      {
        error: "No hay conexión activa con Azure DevOps para esta cuenta.",
        items: [],
      },
      { status: 502 },
    );
  }

  try {
    const items = await listReportedNews({
      auth: scopedAuthForProject(adoCaller, scopesResult.value[0]!.projectId),
      scopes: scopesResult.value,
      dateFilter: dateFilterResult.value,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "No pudimos consultar las novedades reportadas.", items: [] },
      { status: 502 },
    );
  }
}

/**
 * Cada scope puede venir de un proyecto distinto, por lo que delegamos al
 * lib de Azure un token por proyecto cuando haga falta. Hoy todo el flow de
 * novedades comparte el mismo `auth` (single-org), así que reusamos la del
 * caller. Si en el futuro hace falta multi-tenant, este helper se extiende.
 */
function scopedAuthForProject(
  baseAuth: NonNullable<Awaited<ReturnType<typeof resolveAdoCaller>>>,
  _project: string,
): NonNullable<Awaited<ReturnType<typeof resolveAdoCaller>>> {
  return baseAuth;
}

function parseScopes(
  raw: string | null,
):
  | { ok: true; value: ReadonlyArray<ReportedNewsScope> }
  | { ok: false; error: string } {
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

function parseDateFilter(input: {
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
