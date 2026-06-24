import "server-only";

import { resolveAdoCaller, type AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  listWorkItemsInSprint,
  type AdoWorkItemOption,
} from "@/lib/azure-devops/work-items";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { buildAdoWorkItemEditUrl } from "@/lib/azure-devops/work-item-url";
import type { InfoListItem } from "@/lib/schemas/agent";

export type ListWorkItemsForQueryArgs = {
  types: ReadonlyArray<"pbi" | "bug" | "task">;
  states?: ReadonlyArray<string>;
  assignedToMe?: boolean;
  limit?: number;
  sprintPath?: string;
};

export type ListWorkItemsForQueryResult =
  | { ok: true; items: InfoListItem[] }
  | { ok: false; userMessage: string };

const MAX_ITEMS = 20;

/**
 * Query Azure DevOps for work items in the active sprint (or in `sprintPath`
 * if provided) and shape them into the `InfoListItem` schema the agent and
 * UI consume. Used by the `list_work_items` tool to answer questions like
 * "¿qué PBIs tengo activos?" or "muéstrame mis bugs abiertos".
 *
 * The auth context is resolved from the session automatically when not
 * passed in (handy for the tool handler).
 */
export async function listWorkItemsForQuery(
  args: ListWorkItemsForQueryArgs,
  auth?: AdoCallerAuth,
): Promise<ListWorkItemsForQueryResult> {
  const adoAuth = auth ?? (await resolveAdoCaller({ persistOAuthTokens: true }));
  if (!adoAuth) {
    return { ok: false, userMessage: "No hay conexión con Azure DevOps." };
  }

  const sprintPath = args.sprintPath?.trim();
  if (!sprintPath) {
    return { ok: false, userMessage: "No hay un sprint activo en este momento." };
  }

  const profile = await resolveProcessProfile(adoAuth);
  const types: Array<"pbi" | "bug" | "task"> =
    args.types.length > 0 ? [...args.types] : ["pbi", "bug", "task"];
  const limit = Math.min(Math.max(args.limit ?? MAX_ITEMS, 1), MAX_ITEMS);

  const wantedTypes = types.map((t) => typeToWorkItemType(t, profile));
  const wantedStates = args.states?.map((s) => s.trim()).filter(Boolean) ?? [];
  const meDisplayName = args.assignedToMe
    ? (await resolveAdoProfile(adoAuth, { persist: true }))?.displayName?.trim() ?? null
    : null;

  const collected: AdoWorkItemOption[] = [];

  for (const workItemType of wantedTypes) {
    if (collected.length >= limit) break;
    const fetched = await listWorkItemsInSprint(adoAuth, sprintPath, {
      workItemType,
      assignee: meDisplayName ?? "",
    });
    for (const item of fetched) {
      if (collected.length >= limit) break;
      if (
        wantedStates.length > 0 &&
        !wantedStates.some((s) => s.localeCompare(item.state, undefined, { sensitivity: "accent" }) === 0)
      ) {
        continue;
      }
      collected.push(item);
    }
  }

  const items: InfoListItem[] = collected.map((it) => ({
    id: it.id,
    type: workItemTypeToInfoType(it.type, profile),
    title: it.title,
    ...(it.state ? { state: it.state } : {}),
    ...(it.assignedTo ? { assignedTo: it.assignedTo } : {}),
    url: buildAdoWorkItemEditUrl({
      organization: adoAuth.organization,
      project: adoAuth.project,
      workItemId: it.id,
    }),
  }));

  return { ok: true, items };
}

function typeToWorkItemType(
  type: "pbi" | "bug" | "task",
  profile: { backlogItemType: string; bugWorkItemType: string; taskWorkItemType: string },
): string {
  switch (type) {
    case "pbi":
      return profile.backlogItemType;
    case "bug":
      return profile.bugWorkItemType;
    case "task":
      return profile.taskWorkItemType;
  }
}

function workItemTypeToInfoType(
  rawType: string,
  profile: { backlogItemType: string; bugWorkItemType: string; taskWorkItemType: string },
): "pbi" | "bug" | "task" {
  if (rawType === profile.bugWorkItemType) return "bug";
  if (rawType === profile.taskWorkItemType) return "task";
  return "pbi";
}
