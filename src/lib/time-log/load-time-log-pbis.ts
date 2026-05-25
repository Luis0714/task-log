import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import type { TimeLogPbisSnapshot } from "@/lib/time-log/load-time-log-baseline";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listWorkItemsInSprint } from "@/lib/azure-devops/work-items";

export const loadTimeLogPbis = cache(async function loadTimeLogPbis(
  project: string,
  sprintPath: string,
  assignee: string,
): Promise<TimeLogPbisSnapshot> {
  if (!project || !sprintPath) {
    return { sprintPbis: [], error: null };
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return { sprintPbis: [], error: null };
  }

  try {
    const sprintPbis = await listWorkItemsInSprint(
      withAdoProject(caller.auth, project),
      sprintPath,
      { assignee },
    );
    return { sprintPbis, error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return {
      sprintPbis: [],
      error: `No se pudieron cargar las historias del sprint. — ${detail}`,
    };
  }
});
