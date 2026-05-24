import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type {
  AdoWorkItemOption,
  WorkItemSprintFilters,
} from "@/lib/azure-devops/work-items";
export {
  listTasksInSprint,
  listWorkItemsInSprint,
} from "@/lib/azure-devops/work-items";

export type AdoSprint = {
  id: string;
  name: string;
  path: string;
  timeFrame?: "past" | "current" | "future";
  startDate?: string;
  finishDate?: string;
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
