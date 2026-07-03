import "server-only";

import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { filterFieldsToProject } from "@/lib/azure-devops/wit-project-fields";

export type ProcessProfileTestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function testProcessProfileConfiguration(
  auth: AdoCallerAuth,
  profile: AdoProcessProfile,
): Promise<ProcessProfileTestResult> {
  const fields = await filterFieldsToProject(auth, [
    "System.Id",
    profile.workingDateField,
    ...profile.workItemDateFieldNames,
  ]);

  if (!fields.includes(profile.workingDateField)) {
    return {
      ok: false,
      message:
        "El campo de fecha de trabajo no existe en este proyecto de Azure DevOps. Elige otro campo o pulsa «Actualizar desde Azure DevOps».",
    };
  }

  return {
    ok: true,
    message: "La configuración es válida: NeosView puede leer el campo de fecha en este proyecto.",
  };
}
