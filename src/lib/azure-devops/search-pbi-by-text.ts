import "server-only";

import { adoFetch, adoProjectBase, escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listWorkItemsInSprint } from "@/lib/azure-devops/work-items";

export type PbiSearchHit = {
  id: number;
  title: string;
  state: string;
};

const MAX_HITS = 8;

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function matches(title: string, tokens: readonly string[]): boolean {
  const haystack = title.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function sanitizeWiql(query: string): string {
  return query.replaceAll("'", "''").replace(/[%_]/g, (m) => `[${m}]`).slice(0, 100);
}

/**
 * Búsqueda en dos niveles:
 * 1) Primero, dentro de las PBIs del sprint actual (rápido, relevante).
 * 2) Si no hay match, fallback a WIQL CONTAINS sobre el proyecto completo.
 *
 * Devuelve hasta `MAX_HITS` resultados, ordenados por relevancia (todos los tokens matchean).
 */
export async function searchPbiByText(
  auth: AdoCallerAuth,
  query: string,
  sprintPath?: string,
): Promise<PbiSearchHit[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  if (sprintPath) {
    const sprintHits = await searchInSprint(auth, sprintPath, tokens);
    if (sprintHits.length > 0) return sprintHits;
  }

  return searchWithWiql(auth, query);
}

async function searchInSprint(
  auth: AdoCallerAuth,
  sprintPath: string,
  tokens: readonly string[],
): Promise<PbiSearchHit[]> {
  try {
    const sprintPbis = await listWorkItemsInSprint(auth, sprintPath, {});
    return sprintPbis
      .filter((pbi) => matches(pbi.title, tokens))
      .slice(0, MAX_HITS)
      .map((pbi) => ({
        id: pbi.id,
        title: pbi.title,
        state: pbi.state,
      }));
  } catch {
    return [];
  }
}

async function searchWithWiql(
  auth: AdoCallerAuth,
  query: string,
): Promise<PbiSearchHit[]> {
  const sanitized = sanitizeWiql(query);
  const project = escapeWiqlString(auth.project);
  const wiql = `
    SELECT [System.Id], [System.Title], [System.State]
    FROM WorkItems
    WHERE [System.TeamProject] = '${project}'
      AND [System.WorkItemType] = 'Product Backlog Item'
      AND [System.State] <> 'Removed'
      AND [System.Title] CONTAINS '${sanitized}'
    ORDER BY [System.ChangedDate] DESC`;

  const url = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: wiql }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { workItems?: Array<{ id: number }> };
  const ids = (data.workItems ?? []).slice(0, MAX_HITS).map((w) => w.id);
  if (ids.length === 0) return [];

  const fields = ["System.Id", "System.Title", "System.State"].join(",");
  const idsParam = ids.join(",");
  const itemsUrl = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${idsParam}&fields=${encodeURIComponent(fields)}&api-version=7.1`;
  const itemsRes = await adoFetch(auth, itemsUrl);
  if (!itemsRes.ok) return [];

  const items = (await itemsRes.json()) as {
    value?: Array<{ id: number; fields?: Record<string, string | undefined> }>;
  };
  return (items.value ?? [])
    .map((it) => ({
      id: it.id,
      title: it.fields?.["System.Title"]?.trim() ?? "",
      state: it.fields?.["System.State"]?.trim() ?? "",
    }))
    .filter((hit) => hit.title.length > 0);
}