import {
  adoFetch,
  adoOrgBase,
  adoProjectBase,
  escapeWiqlString,
} from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

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

type TeamsResponse = {
  value?: Array<{ name: string }>;
};

type ClassificationNode = {
  id: number;
  name: string;
  path?: string;
  structureType?: string;
  hasChildren?: boolean;
  children?: ClassificationNode[];
  attributes?: {
    startDate?: string;
    finishDate?: string;
  };
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

function adoErrorMessage(res: Response, body: string, fallback: string): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}

function normalizeIterationPath(rawPath: string): string {
  return rawPath.replace(/^\\+/, "");
}

function inferTimeFrame(
  startDate?: string,
  finishDate?: string,
): AdoSprint["timeFrame"] | undefined {
  const now = Date.now();
  const start = startDate ? Date.parse(startDate) : Number.NaN;
  const finish = finishDate ? Date.parse(finishDate) : Number.NaN;

  if (Number.isFinite(start) && Number.isFinite(finish)) {
    if (now < start) return "future";
    if (now > finish) return "past";
    return "current";
  }

  return undefined;
}

async function resolveTeamName(auth: AdoCallerAuth): Promise<string | null> {
  const fromEnv = process.env.AZDO_TEAM?.trim();
  if (fromEnv) return fromEnv;

  const url = `${adoOrgBase(auth)}/_apis/projects/${encodeURIComponent(auth.project)}/teams?api-version=7.1&$top=50`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return null;

  const data = (await res.json()) as TeamsResponse;
  const team = data.value?.[0]?.name?.trim();
  return team ?? null;
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

async function listTeamIterations(
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

function collectIterationNodes(node: ClassificationNode, acc: AdoSprint[] = []): AdoSprint[] {
  const isSelectableIteration =
    node.structureType === "iteration" &&
    !node.hasChildren &&
    node.path &&
    node.name.toLowerCase() !== "iteration";

  if (isSelectableIteration) {
    acc.push({
      id: String(node.id),
      name: node.name,
      path: normalizeIterationPath(node.path!),
      startDate: node.attributes?.startDate,
      finishDate: node.attributes?.finishDate,
      timeFrame: inferTimeFrame(node.attributes?.startDate, node.attributes?.finishDate),
    });
  }

  for (const child of node.children ?? []) {
    collectIterationNodes(child, acc);
  }

  return acc;
}

async function listProjectIterationNodes(auth: AdoCallerAuth): Promise<AdoSprint[]> {
  const url = `${adoProjectBase(auth)}/_apis/wit/classificationnodes/Iterations?$depth=10&api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(adoErrorMessage(res, body, "No se pudieron cargar las iteraciones del proyecto."));
  }

  const root = (await res.json()) as ClassificationNode;
  const sprints = collectIterationNodes(root).sort(sortSprints);

  if (sprints.length === 0) {
    throw new Error("No hay sprints configurados en el proyecto.");
  }

  return sprints;
}

export async function listTeamSprints(auth: AdoCallerAuth): Promise<AdoSprint[]> {
  const team = await resolveTeamName(auth);

  if (team) {
    try {
      const teamSprints = await listTeamIterations(auth, team);
      if (teamSprints.length > 0) return teamSprints;
    } catch {
      // Fallback al árbol de iteraciones del proyecto.
    }
  }

  return listProjectIterationNodes(auth);
}

async function fetchWorkItemDetails(
  auth: AdoCallerAuth,
  ids: number[],
): Promise<AdoWorkItemOption[]> {
  if (ids.length === 0) return [];

  const fields = [TITLE, WORK_ITEM_TYPE, STATE].join(",");
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
      });
    }
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function listWorkItemsInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
): Promise<AdoWorkItemOption[]> {
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(iterationPath);

  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project}' AND [System.IterationPath] UNDER '${path}' AND [System.State] <> 'Removed' ORDER BY [System.ChangedDate] DESC`,
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
