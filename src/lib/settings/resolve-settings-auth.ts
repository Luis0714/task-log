import "server-only";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller, type AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type SettingsAuthResult =
  | { ok: true; auth: AdoCallerAuth }
  | { ok: false; status: number; error: string };

export async function resolveSettingsAuth(project: string): Promise<SettingsAuthResult> {
  const caller = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!caller) {
    return { ok: false, status: 401, error: ADO_SIGN_IN_REQUIRED_MESSAGE };
  }

  const trimmedProject = project.trim();
  if (!trimmedProject) {
    return { ok: false, status: 400, error: "Indica el proyecto de Azure DevOps." };
  }

  return { ok: true, auth: withAdoProject(caller, trimmedProject) };
}
