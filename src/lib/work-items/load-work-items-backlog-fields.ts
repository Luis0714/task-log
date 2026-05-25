import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getBacklogFieldsMetadata } from "@/lib/azure-devops/backlog-item-fields";
import { withAdoProject } from "@/lib/azure-devops/projects";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";

export const loadWorkItemsBacklogFields = cache(async function loadWorkItemsBacklogFields(
  project: string,
): Promise<BacklogResponsableFieldDto[]> {
  if (!project) return [];

  const caller = await requireAdoCaller();
  if (!caller.ok) return [];

  try {
    const metadata = await getBacklogFieldsMetadata(withAdoProject(caller.auth, project));
    return metadata.fields;
  } catch {
    return [];
  }
});
