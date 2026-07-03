import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import type { TimeLogPbisSnapshot } from "@/lib/time-log/load-time-log-baseline";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listBacklogWorkItems } from "@/lib/azure-devops/backlog-items";
import { listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import { isBacklogScope } from "@/lib/time-log/backlog-scope";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { logApiError } from "@/lib/errors/log-api-error";

export const loadTimeLogPbis = cache(async function loadTimeLogPbis(
  project: string,
  team: string,
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
    const auth = withAdoProject(caller.auth, project);
    const sprintPbis = isBacklogScope(sprintPath)
      ? await listBacklogWorkItems(auth, { assignee, team })
      : await listWorkItemsInSprint(auth, sprintPath, { assignee });
    return { sprintPbis, error: null };
  } catch (cause) {
    logApiError("loadTimeLogPbis", cause);
    return {
      sprintPbis: [],
      error: USER_MESSAGES.timeLogPbisLoadFailed,
    };
  }
});
