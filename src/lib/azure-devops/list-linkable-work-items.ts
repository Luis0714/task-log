import "server-only";

import { listBacklogWorkItems } from "@/lib/azure-devops/backlog-items";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTeamIterations } from "@/lib/azure-devops/sprints";
import {
  listWorkItemsInSprint,
  type AdoWorkItemOption,
} from "@/lib/azure-devops/work-items";
import { resolvePreferredSprint } from "@/lib/time-log/form-selection";

export type ListLinkableWorkItemsInput = {
  team: string;
  includeBacklog: boolean;
};

export async function listLinkableWorkItems(
  auth: AdoCallerAuth,
  input: ListLinkableWorkItemsInput,
): Promise<AdoWorkItemOption[]> {
  const profile = await resolveProcessProfile(auth);
  const types = uniqueNonEmpty([
    profile.backlogItemType,
    profile.bugWorkItemType,
    profile.taskWorkItemType,
  ]);
  if (types.length === 0) return [];

  if (input.includeBacklog) {
    return listByTypes(types, (workItemType) =>
      listBacklogWorkItems(auth, { team: input.team, workItemType }),
    );
  }

  const sprints = await listTeamIterations(auth, input.team);
  const sprintPath = resolvePreferredSprint(sprints);
  if (!sprintPath) return [];

  return listByTypes(types, (workItemType) =>
    listWorkItemsInSprint(auth, sprintPath, { workItemType }),
  );
}

async function listByTypes(
  types: readonly string[],
  listOne: (workItemType: string) => Promise<AdoWorkItemOption[]>,
): Promise<AdoWorkItemOption[]> {
  const groups = await Promise.all(types.map(listOne));
  return dedupeById(groups.flat());
}

function dedupeById(items: readonly AdoWorkItemOption[]): AdoWorkItemOption[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function uniqueNonEmpty(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
