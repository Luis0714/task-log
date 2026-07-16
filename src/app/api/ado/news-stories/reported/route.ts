import "server-only";

import { NextResponse } from "next/server";

import { listReportedNews } from "@/lib/azure-devops/list-reported-news";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  parseReportedNewsDateFilter,
  parseReportedNewsScopes,
} from "@/lib/azure-devops/parse-reported-news-query";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

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
  const scopesResult = parseReportedNewsScopes(url.searchParams.get("scopes"));
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

  const dateFilterResult = parseReportedNewsDateFilter({
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
 * lib de Azure un token por proyecto cuando haga falta. Hoy todos el flow de
 * novedades comparte el mismo `auth` (single-org), así que reusamos la del
 * caller. Si en el futuro hace falta multi-tenant, este helper se extiende.
 */
function scopedAuthForProject(
  baseAuth: NonNullable<Awaited<ReturnType<typeof resolveAdoCaller>>>,
  _project: string,
): NonNullable<Awaited<ReturnType<typeof resolveAdoCaller>>> {
  return baseAuth;
}
