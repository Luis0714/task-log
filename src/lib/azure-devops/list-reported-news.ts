import "server-only";

import { adoFetch, adoProjectBase, escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { buildWiqlIdsQuery, runWiqlIdsQuery } from "@/lib/azure-devops/wiql";
import { getRepositories } from "@/lib/db";
import type { NewsStoriesRepository } from "@/lib/db/ports/news-stories.repository.port";
import { splitAdoDateTime } from "@/lib/solicitudes/time-calc";

/**
 * Modelo de dominio — una "novedad reportada" en una HU vinculada.
 *
 * Los nombres de los campos custom (`Custom.FechaInicio`, etc.) son específicos
 * de la configuración "Novedades" del proyecto. Esta capa los normaliza al
 * dominio para que el resto de la app (UI actual y reporte futuro) no
 * dependa de los nombres crudos de ADO.
 */
export type ReportedNewsDetail = Readonly<{
  id: number;
  title: string;
  state: string;
  assignedTo: string | null;
  description: string | null;
  /** Fecha civil `YYYY-MM-DD` extraída del campo DateTime de ADO. */
  fechaInicio: string | null;
  /** Hora `HH:mm` extraída del campo DateTime de ADO; `null` si no trae hora. */
  fechaInicioHora: string | null;
  fechaFin: string | null;
  fechaFinHora: string | null;
  fechaReintegro: string | null;
  fechaReintegroHora: string | null;
  tipoNovedad: string | null;
  parentId: number | null;
  createdDate: string | null;
  /** Horas reportadas de la novedad (Completed Work). Días = horas / 8. */
  completedWork: number | null;
}>;

const MAX_IDS_PER_REQUEST = 200;
const NOVEDADES_WORK_ITEM_TYPE = "Novedades";
const NOVEDADES_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.AssignedTo",
  "System.CreatedDate",
  "System.Description",
  "Custom.FechaInicio",
  "Custom.FechaFin",
  "Custom.FechaReintegro",
  "Custom.TipodeNovedad",
  "System.Parent",
  "Microsoft.VSTS.Scheduling.CompletedWork",
] as const;

/** Rango de fechas de un mes en formato civil `YYYY-MM-DD`. */
export type MonthBounds = Readonly<{
  /** `YYYY-MM-01` — primer día del mes (inclusive). */
  startKey: string;
  /** `YYYY-MM-01` del mes siguiente — usado como `<` exclusivo en WIQL. */
  endExclusiveKey: string;
}>;

/**
 * Devuelve el rango de fechas que cubre el mes `YYYY-MM` dado. El límite
 * superior es el primer día del mes siguiente (exclusivo), lo que casa con el
 * patrón `< 'YYYY-MM-01-of-next-month' AND >= 'YYYY-MM-01'` que devuelve
 * exactamente las novedades que **se cruzan** con ese mes.
 *
 * Devuelve `null` si el input no es un mes válido (formato o rango).
 */
export function monthBounds(monthKey: string): MonthBounds | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const startKey = `${year}-${pad(month)}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endExclusiveKey = `${nextYear}-${pad(nextMonth)}-01`;
  return { startKey, endExclusiveKey };
}

export type ReportedNewsDateFilter =
  | { kind: "month"; monthKey: string }
  | { kind: "range"; fromKey: string; toKey: string }
  | { kind: "none" };

export type ReportedNewsScope = Readonly<{
  projectId: string;
  teamId: string | null;
}>;

export type ListReportedNewsArgs = Readonly<{
  /** Universo multi-scope: cada elemento define un par (proyecto, equipo)
   *  del que se quieren consultar novedades. Un `teamId = null` significa
   *  "a nivel de proyecto". */
  scopes: ReadonlyArray<ReportedNewsScope>;
  /** Filtro por fechas; `undefined` ≡ `{ kind: "none" }` (modo "Todas"). */
  dateFilter?: ReportedNewsDateFilter;
}>;

/** Dependencias inyectables (útil en tests). */
export type ListReportedNewsDeps = Readonly<{
  repo: NewsStoriesRepository;
}>;

/**
 * Punto único — devuelve las novedades reportadas en el rango pedido para las
 * HUs vinculadas al universo multi-scope recibido.
 *
 * Flujo:
 *  1. Recorre los `scopes` y une los IDs de HUs vinculadas (la BD ya hace
 *     el OR entre cada equipo y `team_id IS NULL`).
 *  2. Lanza UNA WIQL con `[System.Parent] IN (…union)` + los filtros de fecha.
 *  3. Enriquece los IDs vía `workitemsbatch`.
 *
 * Devuelve `[]` si no hay scopes, no hay HUs vinculadas, o la WIQL falla.
 * Los errores se devuelven como `[]` para no romper el resto de la pantalla.
 *
 * Es el helper que la pantalla de administración y el reporte deben reutilizar.
 */
export async function listReportedNews(
  args: { auth: AdoCallerAuth } & ListReportedNewsArgs,
  deps?: ListReportedNewsDeps,
): Promise<ReportedNewsDetail[]> {
  const repo = deps?.repo ?? getRepositories().newsStories;
  if (args.scopes.length === 0) return [];

  const parentIds = new Set<number>();
  for (const scope of args.scopes) {
    const projectId = scope.projectId.trim();
    if (!projectId) continue;
    const linked = await repo.list({
      projectIds: [projectId],
      teamIds: scope.teamId !== null ? [scope.teamId] : undefined,
    });
    for (const row of linked) {
      if (Number.isInteger(row.workItemId) && row.workItemId > 0) {
        parentIds.add(row.workItemId);
      }
    }
  }
  if (parentIds.size === 0) return [];

  const ids = await listReportedNewsIdsByParent(args.auth, {
    parentIds: Array.from(parentIds),
    dateFilter: args.dateFilter ?? { kind: "none" },
  });
  if (ids.length === 0) return [];

  return fetchReportedNewsByIds(args.auth, ids);
}

/**
 * Step 1 — resuelve en WIQL los IDs de los work items de tipo "Novedades"
 * cuyo padre está en `parentIds` y cuyo rango [FechaInicio, FechaFin] se cruza
 * con el filtro pedido.
 *
 * Si `dateFilter.kind === "none"`, no se aplica filtro de fechas — se
 * devuelven todas las novedades.
 */
export async function listReportedNewsIdsByParent(
  auth: AdoCallerAuth,
  args: { parentIds: ReadonlyArray<number>; dateFilter: ReportedNewsDateFilter },
): Promise<number[]> {
  if (args.parentIds.length === 0) return [];

  const parentIdList = Array.from(
    new Set(args.parentIds.filter((id) => Number.isInteger(id) && id > 0)),
  );
  if (parentIdList.length === 0) return [];

  const conditions = [
    `[System.TeamProject] = '${escapeWiqlString(auth.project)}'`,
    `[System.WorkItemType] = '${escapeWiqlString(NOVEDADES_WORK_ITEM_TYPE)}'`,
    `[System.State] <> 'Removed'`,
    `[System.Parent] IN (${parentIdList.join(", ")})`,
    ...buildDateConditions(args.dateFilter),
  ];

  const query = buildWiqlIdsQuery(conditions, "[Custom.FechaInicio] DESC");
  return runWiqlIdsQuery(
    auth,
    query,
    "No se pudieron consultar las novedades reportadas.",
  );
}

/**
 * Convierte el filtro de fecha de dominio a cláusulas WIQL. Devuelve un array
 * vacío cuando no hay filtro (modo "Todas").
 */
export function buildDateConditions(
  filter: ReportedNewsDateFilter,
): string[] {
  if (filter.kind === "none") return [];
  if (filter.kind === "month") {
    const bounds = monthBounds(filter.monthKey);
    if (!bounds) return [];
    return [
      // Novedad que se cruza con el mes: empieza antes del fin del mes y
      // termina después del inicio del mes.
      `[Custom.FechaInicio] < '${bounds.endExclusiveKey}'`,
      `[Custom.FechaFin] >= '${bounds.startKey}'`,
    ];
  }
  // "range": la novedad debe cruzarse con [from, to] (ambas inclusive).
  return [
    `[Custom.FechaInicio] <= '${filter.toKey}'`,
    `[Custom.FechaFin] >= '${filter.fromKey}'`,
  ];
}

/**
 * Step 2 — enriquece los IDs via `workitemsbatch`
 * (`POST /_apis/wit/workitemsbatch`) y devuelve `ReportedNewsDetail[]`. El
 * endpoint batch acepta hasta 200 IDs por request; si la lista excede se
 * pagina en serie y se concatenan los resultados.
 */
export async function fetchReportedNewsByIds(
  auth: AdoCallerAuth,
  ids: ReadonlyArray<number>,
): Promise<ReportedNewsDetail[]> {
  const uniqueIds = Array.from(
    new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
  );
  if (uniqueIds.length === 0) return [];

  const details: ReportedNewsDetail[] = [];
  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST);
    const url = `${adoProjectBase(auth)}/_apis/wit/workitemsbatch?api-version=7.1`;
    const res = await adoFetch(auth, url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: chunk,
        fields: [...NOVEDADES_FIELDS],
      }),
    });
    if (!res.ok) continue;

    const body = (await res.json()) as {
      value?: Array<{
        id: number;
        fields?: Record<string, unknown>;
      }>;
    };
    for (const item of body.value ?? []) {
      details.push(mapReportedNews(item.id, item.fields ?? {}));
    }
  }
  return details;
}

function mapReportedNews(
  id: number,
  fields: Record<string, unknown>,
): ReportedNewsDetail {
  const stringField = (key: string): string | null => {
    const value = fields[key];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  const intField = (key: string): number | null => {
    const value = fields[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
    return null;
  };
  const numberField = (key: string): number | null => {
    const value = fields[key];
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const assignedTo = readAssignedTo(fields["System.AssignedTo"]);
  const inicio = splitDateTimeField(stringField("Custom.FechaInicio"));
  const fin = splitDateTimeField(stringField("Custom.FechaFin"));
  const reintegro = splitDateTimeField(stringField("Custom.FechaReintegro"));

  return {
    id,
    title: stringField("System.Title") ?? `Novedad #${id}`,
    state: stringField("System.State") ?? "",
    assignedTo,
    description: stringField("System.Description"),
    fechaInicio: inicio.dateKey,
    fechaInicioHora: inicio.timeStr,
    fechaFin: fin.dateKey,
    fechaFinHora: fin.timeStr,
    fechaReintegro: reintegro.dateKey,
    fechaReintegroHora: reintegro.timeStr,
    tipoNovedad: stringField("Custom.TipodeNovedad"),
    parentId: intField("System.Parent"),
    createdDate: stringField("System.CreatedDate"),
    completedWork: numberField("Microsoft.VSTS.Scheduling.CompletedWork"),
  };
}

function readAssignedTo(value: unknown): string | null {
  if (value && typeof value === "object" && "displayName" in value) {
    const displayName = (value as { displayName?: unknown }).displayName;
    if (typeof displayName === "string" && displayName.trim().length > 0) {
      return displayName.trim();
    }
  }
  return null;
}

/**
 * Variante tolerante a `null`/vacío para campos Date/DateTime de ADO. Devuelve
 * `{ dateKey: null, timeStr: null }` si no hay valor; en caso contrario delega
 * en `splitAdoDateTime`. Si el valor no trae `T…` (campos Date legacy) la hora
 * queda en `null`.
 */
function splitDateTimeField(
  raw: string | null,
): { dateKey: string | null; timeStr: string | null } {
  if (!raw) return { dateKey: null, timeStr: null };
  const split = splitAdoDateTime(raw);
  if (!split) return { dateKey: null, timeStr: null };
  return { dateKey: split.dateKey, timeStr: split.timeStr };
}
