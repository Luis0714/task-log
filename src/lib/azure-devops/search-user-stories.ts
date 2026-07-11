import "server-only";

import { adoFetch, adoProjectBase, escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { isNumericIdQuery } from "@/lib/schemas/news-stories";

export type UserStorySearchHit = {
  id: number;
  title: string;
  state: string;
  /** Ruta del área; sirve para mostrar contexto de la HU al administrador. */
  areaPath: string | null;
};

const DEFAULT_HIT_LIMIT = 20;
const MAX_QUERY_LENGTH = 100;
const USER_STORY_FIELDS = ["System.Id", "System.Title", "System.State", "System.AreaPath"];

function sanitizeWiqlText(value: string): string {
  return value
    .replace(/'/g, "''")
    .replace(/[%_]/g, (m) => `[${m}]`)
    .slice(0, MAX_QUERY_LENGTH);
}

function buildCommonWhere(): string[] {
  return [
    "[System.TeamProject] = '@@PROJECT@@'",
    "[System.WorkItemType] = 'User Story'",
    "[System.State] <> 'Removed'",
  ];
}

/**
 * Búsqueda en tiempo real de Historias de Usuario en el backlog del proyecto.
 *
 * Modos (HU-02):
 * - Query numérica → busca por `System.Id` exacto (pegar ID en el buscador).
 * - Query de texto (≥3 chars) → filtra por título con `CONTAINS`.
 * - Sin query → devuelve las HUs más recientes del proyecto.
 *
 * Si se pasa `team`, se filtra además por el área del equipo en Azure.
 * Si la búsqueda falla (Azure caído, permisos, etc.) devuelve `[]`.
 */
export async function searchUserStories(
  auth: AdoCallerAuth,
  input: { team?: string | null; query?: string | null; limit?: number },
): Promise<UserStorySearchHit[]> {
  const limit = input.limit ?? DEFAULT_HIT_LIMIT;
  const sanitizedTitle = input.query ? sanitizeWiqlText(input.query.trim()) : "";
  const project = escapeWiqlString(auth.project);

  const where = buildCommonWhere();
  let mode: "id" | "title" | "recent" = "recent";

  if (sanitizedTitle) {
    if (isNumericIdQuery(sanitizedTitle)) {
      where.push("[System.Id] = @@ID@@");
      mode = "id";
    } else {
      where.push("[System.Title] CONTAINS '@@TITLE@@'");
      mode = "title";
    }
  }
  if (input.team && input.team.trim().length > 0) {
    where.push("[System.AreaPath] UNDER '@@TEAM@@'");
  }

  const wiql = `
    SELECT [System.Id], [System.Title], [System.State], [System.AreaPath]
    FROM WorkItems
    WHERE ${where.join(" AND ")}
    ORDER BY [System.ChangedDate] DESC`;

  const replacements: Record<string, string> = {
    "@@PROJECT@@": project,
    "@@TEAM@@": escapeWiqlString(input.team ?? ""),
    "@@TITLE@@": sanitizedTitle,
    "@@ID@@": sanitizedTitle,
  };
  const wiqlBody = wiql.replaceAll(/@@[A-Z_]+@@/g, (token) => replacements[token] ?? "");

  const wiqlUrl = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1`;
  const wiqlRes = await adoFetch(auth, wiqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: wiqlBody }),
  });
  if (!wiqlRes.ok) return [];

  const wiqlData = (await wiqlRes.json()) as {
    workItems?: Array<{ id: number }>;
  };

  const ids =
    mode === "id"
      ? (wiqlData.workItems ?? [])
          .filter((w) => Number(w.id) === Number(sanitizedTitle))
          .slice(0, limit)
          .map((w) => w.id)
      : (wiqlData.workItems ?? []).slice(0, limit).map((w) => w.id);

  if (ids.length === 0) return [];

  const itemsUrl = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${ids.join(",")}&fields=${encodeURIComponent(USER_STORY_FIELDS.join(","))}&api-version=7.1`;
  const itemsRes = await adoFetch(auth, itemsUrl);
  if (!itemsRes.ok) return [];

  const items = (itemsRes.json ? await itemsRes.json() : null) as {
    value?: Array<{ id: number; fields?: Record<string, string | undefined> }>;
  } | null;

  return (items?.value ?? [])
    .map<UserStorySearchHit | null>((it) => {
      const title = (it.fields?.["System.Title"] ?? "").trim();
      if (!title) return null;
      const state = (it.fields?.["System.State"] ?? "").trim();
      const areaPath = it.fields?.["System.AreaPath"] ?? null;
      return { id: it.id, title, state, areaPath };
    })
    .filter((hit): hit is UserStorySearchHit => hit !== null);
}