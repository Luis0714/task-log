import {
  adoFetch,
  adoProjectBase,
  escapeWiqlString,
} from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  isWorkItemAssigneeAll,
  isWorkItemAssigneeMe,
  WORK_ITEM_ASSIGNEE_ALL,
} from "@/lib/schemas/work-item-filters";

export type AdoSprint = {
  id: string;
  name: string;
  path: string;
  timeFrame?: "past" | "current" | "future";
  startDate?: string;
  finishDate?: string;
};

export type AdoWorkItemOption = {
  id: number;
  title: string;
  type: string;
  state: string;
  assignedTo?: string;
};

type TeamIterationsResponse = {
  value?: Array<{
    id: string;
    name: string;
    path: string;
    attributes?: {
      startDate?: string;
      finishDate?: string;
      timeFrame?: "past" | "current" | "future";
    };
  }>;
};

type WiqlResponse = {
  workItems?: Array<{ id: number }>;
};

type WorkItemsBatchResponse = {
  value?: Array<{
    id: number;
    fields?: Record<string, string | number | undefined>;
  }>;
};

const TITLE = "System.Title";
const WORK_ITEM_TYPE = "System.WorkItemType";
const STATE = "System.State";
const ASSIGNED_TO = "System.AssignedTo";

function parseAssignedTo(value: string | number | undefined): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function parseAssignedToField(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "displayName" in value) {
    const displayName = (value as { displayName?: string }).displayName;
    return typeof displayName === "string" ? displayName.trim() : "";
  }
  return parseAssignedTo(value as string | number | undefined);
}

function adoErrorMessage(res: Response, body: string, fallback: string): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}

export async function listTeamIterations(
  auth: AdoCallerAuth,
  team: string,
): Promise<AdoSprint[]> {
  const url = `${adoProjectBase(auth)}/${encodeURIComponent(team)}/_apis/work/teamsettings/iterations?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(adoErrorMessage(res, body, "No se pudieron cargar los sprints del equipo."));
  }

  const data = (await res.json()) as TeamIterationsResponse;
  return (data.value ?? [])
    .map((iteration) => ({
      id: iteration.id,
      name: iteration.name,
      path: iteration.path,
      timeFrame: iteration.attributes?.timeFrame,
      startDate: iteration.attributes?.startDate,
      finishDate: iteration.attributes?.finishDate,
    }))
    .sort(sortSprints);
}

function sortSprints(a: AdoSprint, b: AdoSprint): number {
  const frameOrder = { current: 0, future: 1, past: 2 } as const;
  const aFrame = a.timeFrame ? frameOrder[a.timeFrame] : 3;
  const bFrame = b.timeFrame ? frameOrder[b.timeFrame] : 3;
  if (aFrame !== bFrame) return aFrame - bFrame;

  const aStart = a.startDate ? Date.parse(a.startDate) : 0;
  const bStart = b.startDate ? Date.parse(b.startDate) : 0;
  return bStart - aStart;
}

/** Sprints asignados al equipo seleccionado (misma fuente que Azure Boards). */
export async function listTeamSprints(
  auth: AdoCallerAuth,
  team: string,
): Promise<AdoSprint[]> {
  const teamName = team.trim();
  if (!teamName) {
    throw new Error("Falta el nombre del equipo.");
  }

  const sprints = await listTeamIterations(auth, teamName);

  if (sprints.length === 0) {
    throw new Error(`El equipo "${teamName}" no tiene sprints asignados en Azure DevOps.`);
  }

  return sprints;
}

async function fetchWorkItemDetails(
  auth: AdoCallerAuth,
  ids: number[],
): Promise<AdoWorkItemOption[]> {
  if (ids.length === 0) return [];

  const fields = [TITLE, WORK_ITEM_TYPE, STATE, ASSIGNED_TO].join(",");
  const chunkSize = 200;
  const items: AdoWorkItemOption[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const url = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`;
    const res = await adoFetch(auth, url);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(adoErrorMessage(res, body, "No se pudieron cargar los work items."));
    }

    const data = (await res.json()) as WorkItemsBatchResponse;
    for (const workItem of data.value ?? []) {
      const title = workItem.fields?.[TITLE];
      items.push({
        id: workItem.id,
        title: typeof title === "string" ? title : `Work item ${workItem.id}`,
        type: String(workItem.fields?.[WORK_ITEM_TYPE] ?? "Item"),
        state: String(workItem.fields?.[STATE] ?? ""),
        assignedTo: parseAssignedToField(workItem.fields?.[ASSIGNED_TO]),
      });
    }
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export type WorkItemSprintFilters = {
  assignee?: string;
  workItemType?: string;
};

function resolveBacklogItemType(): string {
  return process.env.AZDO_BACKLOG_ITEM_TYPE?.trim() || "Product Backlog Item";
}

export async function listWorkItemsInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
  filters: WorkItemSprintFilters = {},
): Promise<AdoWorkItemOption[]> {
  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const workItemType = filters.workItemType?.trim() || resolveBacklogItemType();
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(iterationPath);

  const conditions = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(workItemType)}'`,
  ];

  if (isWorkItemAssigneeMe(assignee)) {
    conditions.push("[System.AssignedTo] = @Me");
  } else if (!isWorkItemAssigneeAll(assignee)) {
    conditions.push(`[System.AssignedTo] = '${escapeWiqlString(assignee)}'`);
  }

  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(" AND ")} ORDER BY [System.ChangedDate] DESC`,
  };

  const url = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wiql),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(adoErrorMessage(res, body, "No se pudieron consultar los work items del sprint."));
  }

  const data = (await res.json()) as WiqlResponse;
  const ids = (data.workItems ?? []).map((item) => item.id);
  return fetchWorkItemDetails(auth, ids);
}
