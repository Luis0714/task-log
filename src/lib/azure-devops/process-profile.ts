import "server-only";

import { cache } from "react";

import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";
import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveOrDiscoverProjectConfig } from "@/lib/azure-devops/project-config-resolver";
import {
  buildWorkItemDateFieldNames,
  DEFAULT_WORKING_DATE_FIELD,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";

function dbConfigToProfile(
  dbConfig: Awaited<ReturnType<typeof resolveOrDiscoverProjectConfig>>,
): AdoProcessProfile {
  const workingDateField = dbConfig.workingDateField ?? DEFAULT_WORKING_DATE_FIELD;

  const workingDateFieldSource =
    dbConfig.configSource === "manual"
      ? "manual"
      : workingDateField === DEFAULT_WORKING_DATE_FIELD
        ? "default"
        : "discovered";

  return {
    workingDateField,
    workingDateFieldSource,
    workItemDateFieldNames: buildWorkItemDateFieldNames(workingDateField),
    timezone: dbConfig.timezone ?? resolveAdoTimeZone(),
    completedWorkField: dbConfig.completedWorkField ?? ADO_FIELD_DEFAULTS.completedWorkField,
    originalEstimateField: dbConfig.originalEstimateField ?? ADO_FIELD_DEFAULTS.originalEstimateField,
    remainingWorkField: dbConfig.remainingWorkField !== undefined
      ? dbConfig.remainingWorkField
      : ADO_FIELD_DEFAULTS.remainingWorkField,
    activityField: dbConfig.activityField !== undefined
      ? dbConfig.activityField
      : ADO_FIELD_DEFAULTS.activityField,
    taskWorkItemType: dbConfig.taskWorkItemType ?? ADO_FIELD_DEFAULTS.taskWorkItemType,
    bugWorkItemType: dbConfig.bugWorkItemType ?? ADO_FIELD_DEFAULTS.bugWorkItemType,
    backlogItemType: dbConfig.backlogItemType ?? ADO_FIELD_DEFAULTS.backlogItemType,
    taskTodoState: dbConfig.taskTodoState ?? "",
    taskDoneState: dbConfig.taskDoneState ?? "",
  };
}

export async function buildProcessProfileForAuth(auth: AdoCallerAuth): Promise<AdoProcessProfile> {
  const dbConfig = await resolveOrDiscoverProjectConfig(auth);
  return dbConfigToProfile(dbConfig);
}

/**
 * Perfil ADO para el proyecto actual.
 * La BD es la fuente de verdad; React cache() deduplica dentro de cada request.
 */
export const resolveProcessProfile = cache(
  async (auth: AdoCallerAuth): Promise<AdoProcessProfile> => {
    return buildProcessProfileForAuth(auth);
  },
);
