import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { fetchTaskActivityValues } from "@/lib/azure-devops/fetch-task-activity-values";
import { listTaskStates } from "@/lib/azure-devops/work-item-type-states";
import { FALLBACK_TASK_META, type TaskMetaResponse } from "@/lib/copilot/task-meta";

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json<TaskMetaResponse>(FALLBACK_TASK_META);
  }

  // Resolvemos el process profile PRIMERO: de ahí sale el work item type
  // y el nombre del campo Activity reales del proyecto. Los valores por
  // defecto (Scrum/Task) no aplican si el proyecto usa otro proceso.
  const processProfile = await resolveProcessProfile(auth);

  const [activities, taskStates] = await Promise.all([
    fetchTaskActivityValues(
      auth,
      processProfile.taskWorkItemType,
      processProfile.activityField,
    ),
    listTaskStates(auth, processProfile.taskWorkItemType),
  ]);

  return NextResponse.json<TaskMetaResponse>({
    activities,
    stateNames: taskStates.length > 0 ? taskStates.map((s) => s.name) : FALLBACK_TASK_META.stateNames,
  });
}
