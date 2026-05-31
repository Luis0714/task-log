import type { AdoContextSearchParams } from "@/lib/ado/types";

function readParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const raw = searchParams?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseAdoContextSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AdoContextSearchParams {
  return {
    project: readParam(searchParams, "project"),
    team: readParam(searchParams, "team"),
    sprint: readParam(searchParams, "sprint"),
    assignee: readParam(searchParams, "assignee"),
    sprintDay: readParam(searchParams, "sprintDay"),
  };
}

export function buildAdoContextQuery(params: {
  project?: string;
  team?: string;
  sprint?: string;
  assignee?: string;
  sprintDay?: string;
}): string {
  const search = new URLSearchParams();
  if (params.project?.trim()) search.set("project", params.project.trim());
  if (params.team?.trim()) search.set("team", params.team.trim());
  if (params.sprint?.trim()) search.set("sprint", params.sprint.trim());
  if (params.assignee?.trim()) search.set("assignee", params.assignee.trim());
  if (params.sprintDay?.trim()) search.set("sprintDay", params.sprintDay.trim());
  const query = search.toString();
  return query ? `?${query}` : "";
}

function applyAdoContextParam(
  params: URLSearchParams,
  key: "project" | "team" | "sprint" | "assignee" | "sprintDay",
  value: string | undefined,
) {
  if (value === undefined) return;
  const trimmed = value.trim();
  if (trimmed) params.set(key, trimmed);
  else params.delete(key);
}

export function mergeAdoContextIntoSearchParams(
  current: URLSearchParams,
  context: {
    project?: string;
    team?: string;
    sprint?: string;
    assignee?: string;
    sprintDay?: string;
  },
): string {
  const params = new URLSearchParams(current.toString());
  applyAdoContextParam(params, "project", context.project);
  applyAdoContextParam(params, "team", context.team);
  applyAdoContextParam(params, "sprint", context.sprint);
  applyAdoContextParam(params, "assignee", context.assignee);
  applyAdoContextParam(params, "sprintDay", context.sprintDay);
  const query = params.toString();
  return query ? `?${query}` : "";
}
