import "server-only";

import { getRepositories } from "@/lib/db";
import type { ProjectConfigRow } from "@/lib/db/ports/project-configuration.repository.port";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectFieldReferenceNames } from "@/lib/azure-devops/wit-project-fields";
import { discoverWorkingDateFieldReference } from "@/lib/azure-devops/working-date-field-discovery";
import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";
import {
  DEFAULT_WORKING_DATE_FIELD,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";
import {
  listTaskStates,
  resolveBacklogWorkItemTypeName,
  resolveBugWorkItemTypeName,
  resolveTaskWorkItemTypeName,
} from "@/lib/azure-devops/work-item-type-states";
import {
  pickDefaultCompletedTaskState,
  pickDefaultOpenTaskState,
} from "@/lib/time-log/task-state-utils";

export async function resolveOrDiscoverProjectConfig(
  auth: AdoCallerAuth,
): Promise<ProjectConfigRow> {
  const repo = getRepositories().projectConfiguration;
  const existing = await repo.findByOrgAndProject(auth.organization, auth.project);
  if (existing) return existing;

  // Primera vez: descubrir desde ADO y persistir
  const taskWIT = resolveTaskWorkItemTypeName();
  const bugWIT = resolveBugWorkItemTypeName();
  const backlogWIT = resolveBacklogWorkItemTypeName();
  const timezone = resolveAdoTimeZone();

  const [projectFields, taskStates, workingDateDiscovered] = await Promise.all([
    listProjectFieldReferenceNames(auth),
    listTaskStates(auth),
    discoverWorkingDateFieldReference(auth, taskWIT),
  ]);

  const envField = process.env.AZDO_WORKING_DATE_FIELD?.trim();
  let workingDateField: string;
  if (envField && projectFields.has(envField)) {
    workingDateField = envField;
  } else if (workingDateDiscovered && projectFields.has(workingDateDiscovered)) {
    workingDateField = workingDateDiscovered;
  } else {
    workingDateField = DEFAULT_WORKING_DATE_FIELD;
  }

  const activityField = projectFields.has(ADO_FIELD_DEFAULTS.activityField)
    ? ADO_FIELD_DEFAULTS.activityField
    : null;

  const taskTodoState = pickDefaultOpenTaskState(taskStates);
  const taskDoneState = pickDefaultCompletedTaskState(taskStates);

  const config = {
    workingDateField,
    timezone,
    completedWorkField: ADO_FIELD_DEFAULTS.completedWorkField,
    originalEstimateField: ADO_FIELD_DEFAULTS.originalEstimateField,
    activityField,
    taskWorkItemType: taskWIT,
    bugWorkItemType: bugWIT,
    backlogItemType: backlogWIT,
    taskTodoState,
    taskDoneState,
    configSource: "auto" as const,
    discoveredAt: new Date(),
  };

  await repo.upsert(auth.organization, auth.project, config);

  return {
    id: "",
    organization: auth.organization,
    project: auth.project,
    updatedAt: new Date(),
    ...config,
  };
}
