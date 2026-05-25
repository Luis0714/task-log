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
