import type {
  NewsStoriesValidationResponse,
  NewsStoryValidationEntry,
} from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";
import type {
  ReportedNewsDateFilter,
  ReportedNewsDetail,
} from "@/lib/azure-devops/list-reported-news";

const FETCH_TIMEOUT_MS = 15_000;

export type NewsStoriesListQuery = Readonly<{
  /** Si está vacío, no se filtra por proyecto. */
  projects?: ReadonlyArray<string>;
  /** Si está vacío, no se filtra por equipo (incluye filas `team_id = NULL`). */
  teams?: ReadonlyArray<string>;
}>;

export type LinkNewsStoryPayload = Readonly<{
  projectId: string;
  teamId: string | null;
  workItemId: number;
  workItemTitle: string | null;
}>;

export type ReportedNewsListQuery = Readonly<{
  /** Universo multi-scope (proyectos × equipos) sobre el que se buscan HUs
   *  vinculadas y, a partir de ellas, las novedades reportadas. */
  scopes: ReadonlyArray<{ project: string; team?: string | null }>;
  dateFilter: ReportedNewsDateFilter;
}>;

export type NewsStoriesServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; status: number };

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<NewsStoriesServiceResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(input, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        typeof body.error === "string"
          ? body.error
          : "No se pudo completar la operación.";
      return { ok: false, message, status: res.status };
    }
    return { ok: true, value: body as T };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar con el servidor.",
      status: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildListQueryString(query: NewsStoriesListQuery): string {
  const params = new URLSearchParams();
  if (query.projects && query.projects.length > 0) {
    params.set("projects", query.projects.join(","));
  }
  if (query.teams && query.teams.length > 0) {
    params.set("teams", query.teams.join(","));
  }
  return params.toString();
}

export async function listNewsStories(
  query: NewsStoriesListQuery,
): Promise<NewsStoriesServiceResult<ProjectTeamNewsStory[]>> {
  const result = await fetchJson<{ stories: ProjectTeamNewsStory[] }>(
    `/api/news-stories?${buildListQueryString(query)}`,
  );
  if (!result.ok) return result;
  return { ok: true, value: result.value.stories ?? [] };
}

export async function linkNewsStory(
  payload: LinkNewsStoryPayload,
): Promise<NewsStoriesServiceResult<ProjectTeamNewsStory>> {
  const result = await fetchJson<{ story: ProjectTeamNewsStory }>(
    `/api/news-stories`,
    {
      method: "POST",
      body: JSON.stringify({
        projectId: payload.projectId,
        teamId: payload.teamId,
        workItemId: payload.workItemId,
        workItemTitle: payload.workItemTitle,
      }),
    },
  );
  if (!result.ok) return result;
  return { ok: true, value: result.value.story };
}

export async function unlinkNewsStory(
  id: string,
): Promise<NewsStoriesServiceResult<{ ok: true }>> {
  return fetchJson<{ ok: true }>(`/api/news-stories/${id}`, {
    method: "DELETE",
  });
}

export async function validateNewsStories(
  query: NewsStoriesListQuery,
): Promise<NewsStoriesServiceResult<NewsStoryValidationEntry[]>> {
  const result = await fetchJson<NewsStoriesValidationResponse>(
    `/api/news-stories/validate?${buildListQueryString(query)}`,
  );
  if (!result.ok) return result;
  return { ok: true, value: result.value.entries ?? [] };
}

export async function listReportedNews(
  query: ReportedNewsListQuery,
): Promise<NewsStoriesServiceResult<ReportedNewsDetail[]>> {
  const params = new URLSearchParams();
  // Universo multi-scope: serializamos cada (proyecto, equipo) como `scope`.
  // El primer elemento sin equipo se manda como `scope=Proyecto:` (con el `:` final).
  if (query.scopes.length > 0) {
    params.set("scopes", query.scopes.map((s) => encodeScope(s)).join("|"));
  }
  encodeDateFilter(params, query.dateFilter);

  const result = await fetchJson<{
    items: ReportedNewsDetail[];
    error?: string;
  }>(`/api/ado/news-stories/reported?${params.toString()}`);
  if (!result.ok) return result;
  return { ok: true, value: result.value.items ?? [] };
}

/** Codifica una scope como "Proyecto" o "Proyecto:Equipo". */
function encodeScope(scope: { project: string; team?: string | null }): string {
  return scope.team ? `${scope.project}:${scope.team}` : `${scope.project}:`;
}

/**
 * Traduce el filtro de fechas a query-params entendidos por la ruta
 * `/api/ado/news-stories/reported`:
 * - `month` → `month=YYYY-MM`
 * - `range` → `from=YYYY-MM-DD&to=YYYY-MM-DD`
 * - `none` → sin params (modo "Todas").
 */
function encodeDateFilter(
  params: URLSearchParams,
  filter: ReportedNewsDateFilter,
): void {
  if (filter.kind === "month") {
    params.set("month", filter.monthKey);
    return;
  }
  if (filter.kind === "range") {
    params.set("from", filter.fromKey);
    params.set("to", filter.toKey);
  }
}