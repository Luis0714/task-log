import "server-only";

import { cache } from "react";

import { readProcessProfileFromSession } from "@/lib/azure-devops/process-profile-session";
import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listProjectFieldReferenceNames } from "@/lib/azure-devops/wit-project-fields";
import { discoverWorkingDateFieldReference } from "@/lib/azure-devops/working-date-field-discovery";
import {
  buildWorkItemDateFieldNames,
  DEFAULT_WORKING_DATE_FIELD,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";
import { resolveTaskWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";

async function resolveWorkingDateFieldForProject(
  auth: AdoCallerAuth,
  projectFields: ReadonlySet<string>,
): Promise<Pick<AdoProcessProfile, "workingDateField" | "workingDateFieldSource">> {
  const envField = process.env.AZDO_WORKING_DATE_FIELD?.trim();

  if (envField && projectFields.has(envField)) {
    return { workingDateField: envField, workingDateFieldSource: "env" };
  }

  const discovered = await discoverWorkingDateFieldReference(
    auth,
    resolveTaskWorkItemTypeName(),
  );
  if (discovered && projectFields.has(discovered)) {
    return { workingDateField: discovered, workingDateFieldSource: "discovered" };
  }

  if (envField && !projectFields.has(envField)) {
    return { workingDateField: DEFAULT_WORKING_DATE_FIELD, workingDateFieldSource: "default" };
  }

  return { workingDateField: DEFAULT_WORKING_DATE_FIELD, workingDateFieldSource: "default" };
}

export async function buildProcessProfileForAuth(auth: AdoCallerAuth): Promise<AdoProcessProfile> {
  const projectFields = await listProjectFieldReferenceNames(auth);
  const { workingDateField, workingDateFieldSource } = await resolveWorkingDateFieldForProject(
    auth,
    projectFields,
  );

  return {
    workingDateField,
    workingDateFieldSource,
    workItemDateFieldNames: buildWorkItemDateFieldNames(workingDateField),
    timezone: resolveAdoTimeZone(),
  };
}

async function resolveProcessProfileUncached(auth: AdoCallerAuth): Promise<AdoProcessProfile> {
  const fromSession = await readProcessProfileFromSession(auth);
  if (fromSession) {
    return fromSession;
  }

  return buildProcessProfileForAuth(auth);
}

const resolveProcessProfileCached = cache(
  async (organization: string, project: string, auth: AdoCallerAuth): Promise<AdoProcessProfile> => {
    void organization;
    void project;
    return resolveProcessProfileUncached(auth);
  },
);

/**
 * Perfil ADO para lectura en Server Components: sesión guardada o detección en vivo.
 * No escribe cookies (usar writeProcessProfileToSession en Route Handlers / al conectar).
 */
export async function resolveProcessProfile(auth: AdoCallerAuth): Promise<AdoProcessProfile> {
  return resolveProcessProfileCached(auth.organization, auth.project, auth);
}
