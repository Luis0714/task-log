import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { listLinkableWorkItems } from "@/lib/azure-devops/list-linkable-work-items";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { mapAssignedWorkItem } from "@/lib/work-items/map-assigned-work-item";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export type LoadLinkableWorkItemsInput = {
  project: string;
  team: string;
  includeBacklog: boolean;
};

export async function loadLinkableWorkItems(
  input: LoadLinkableWorkItemsInput,
): Promise<LinkableWorkItemDto[]> {
  const project = input.project.trim();
  const team = input.team.trim();
  if (!project || !team) return [];

  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];

  const [items, profile] = await Promise.all([
    listLinkableWorkItems(auth, {
      team,
      includeBacklog: input.includeBacklog,
    }),
    resolveProcessProfile(auth),
  ]);

  return items.map((item) =>
    mapAssignedWorkItem(item, {
      pbi: profile.backlogItemType,
      bug: profile.bugWorkItemType,
      task: profile.taskWorkItemType,
    }),
  );
}
