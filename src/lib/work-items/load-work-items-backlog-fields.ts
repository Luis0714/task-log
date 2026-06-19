import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getBacklogFieldsMetadata } from "@/lib/azure-devops/backlog-item-fields";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { withAdoProject } from "@/lib/azure-devops/projects";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";

export const loadWorkItemsBacklogFields = cache(async function loadWorkItemsBacklogFields(
  project: string,
): Promise<BacklogResponsableFieldDto[]> {
  if (!project) return [];

  const caller = await requireAdoCaller();
  if (!caller.ok) return [];

  try {
    const auth = withAdoProject(caller.auth, project);
    const processProfile = await resolveProcessProfile(auth);
    const metadata = await getBacklogFieldsMetadata(auth, processProfile.backlogItemType);
    return metadata.fields;
  } catch {
    return [];
  }
});
