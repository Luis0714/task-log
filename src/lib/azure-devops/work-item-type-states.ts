import { adoFetch, adoOrgBase, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectTeams } from "@/lib/azure-devops/teams";

export type AdoWorkItemTypeState = {
  name: string;
  category: string;
};

export async function listWorkItemTypeStates(
  auth: AdoCallerAuth,
  workItemType: string,
): Promise<AdoWorkItemTypeState[]> {
  const typeName = workItemType.trim();
  if (!typeName) {
    throw new Error("Falta el tipo de work item.");
  }

  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(typeName)}?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 300) || `No se pudieron cargar estados de ${typeName}.`);
  }

  const data = (await res.json()) as {
    states?: Array<{ name?: string; category?: string }>;
  };

  return (data.states ?? [])
    .map((state) => ({
      name: state.name?.trim() ?? "",
      category: state.category?.trim() ?? "",
    }))
    .filter((state) => state.name.length > 0);
}

export function resolveTaskWorkItemTypeName(): string {
  return process.env.AZDO_TASK_WORK_ITEM_TYPE?.trim() || "Task";
}

export function resolveBacklogWorkItemTypeName(): string {
  return process.env.AZDO_BACKLOG_ITEM_TYPE?.trim() || "Product Backlog Item";
}

export function resolveBugWorkItemTypeName(): string {
  return process.env.AZDO_BUG_WORK_ITEM_TYPE?.trim() || "Bug";
}

/** Lista los estados de tareas. Usar `workItemType` del processProfile cuando esté disponible. */
export async function listTaskStates(
  auth: AdoCallerAuth,
  workItemType?: string,
): Promise<AdoWorkItemTypeState[]> {
  return listWorkItemTypeStates(auth, workItemType ?? resolveTaskWorkItemTypeName());
}

/** Lista los estados de backlog items. Usar `workItemType` del processProfile cuando esté disponible. */
export async function listBacklogItemStates(
  auth: AdoCallerAuth,
  workItemType?: string,
): Promise<AdoWorkItemTypeState[]> {
  return listWorkItemTypeStates(auth, workItemType ?? resolveBacklogWorkItemTypeName());
}

/** Lista los estados de bugs. Usar `workItemType` del processProfile cuando esté disponible. */
export async function listBugStates(
  auth: AdoCallerAuth,
  workItemType?: string,
): Promise<AdoWorkItemTypeState[]> {
  return listWorkItemTypeStates(auth, workItemType ?? resolveBugWorkItemTypeName());
}

export async function findTaskState(
  auth: AdoCallerAuth,
  stateName: string,
): Promise<AdoWorkItemTypeState | null> {
  const states = await listTaskStates(auth);
  return states.find((state) => state.name === stateName) ?? null;
}

export type AdoTeamMember = {
  id: string;
  displayName: string;
  uniqueName?: string;
};

type TeamMembersResponse = {
  value?: Array<{
    identity?: {
      id?: string;
      displayName?: string;
      uniqueName?: string;
    };
  }>;
};

export async function listTeamMembers(
  auth: AdoCallerAuth,
  teamName: string,
): Promise<AdoTeamMember[]> {
  const normalizedTeam = teamName.trim();
  if (!normalizedTeam) return [];

  const teams = await listProjectTeams(auth);
  const team = teams.find((item) => item.name === normalizedTeam);
  if (!team) {
    throw new Error(`No se encontró el equipo "${normalizedTeam}" en el proyecto.`);
  }

  const url = `${adoOrgBase(auth)}/_apis/projects/${encodeURIComponent(auth.project)}/teams/${encodeURIComponent(team.id)}/members?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 300) || "No se pudieron cargar los miembros del equipo.");
  }

  const data = (await res.json()) as TeamMembersResponse;
  const members = (data.value ?? [])
    .map((entry) => ({
      id: entry.identity?.id?.trim() ?? "",
      displayName: entry.identity?.displayName?.trim() ?? "",
      uniqueName: entry.identity?.uniqueName?.trim(),
    }))
    .filter((member) => member.id && member.displayName);

  const unique = new Map<string, AdoTeamMember>();
  for (const member of members) {
    unique.set(member.id, member);
  }

  return [...unique.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es"),
  );
}
