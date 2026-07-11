import type {
  NewsStoriesValidationResponse,
  NewsStoryValidationEntry,
} from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";

const FETCH_TIMEOUT_MS = 15_000;

export type NewsStoriesListQuery = Readonly<{
  projectId: string;
  teamId?: string | null;
}>;

export type NewsStoriesSearchQuery = Readonly<{
  project: string;
  team?: string | null;
  q: string;
  limit?: number;
}>;

export type LinkNewsStoryPayload = Readonly<{
  projectId: string;
  teamId: string | null;
  workItemId: number;
  workItemTitle: string | null;
}>;

export type AdoUserStoryHit = {
  id: number;
  title: string;
  state: string;
  areaPath: string | null;
};

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
  const params = new URLSearchParams({ projectId: query.projectId });
  if (query.teamId) params.set("teamId", query.teamId);
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

export async function searchAdoUserStories(
  query: NewsStoriesSearchQuery,
  signal?: AbortSignal,
): Promise<NewsStoriesServiceResult<AdoUserStoryHit[]>> {
  const params = new URLSearchParams({
    project: query.project,
    q: query.q,
  });
  if (query.team) params.set("team", query.team);
  if (query.limit !== undefined) params.set("limit", String(query.limit));

  const result = await fetchJson<{ stories: AdoUserStoryHit[]; error?: string }>(
    `/api/ado/news-stories?${params.toString()}`,
    signal ? { signal } : undefined,
  );
  if (!result.ok) return result;
  return {
    ok: true,
    value: (result.value.stories ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      state: s.state,
      areaPath: s.areaPath,
    })),
  };
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