import "server-only";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { hasActiveUserSession } from "@/lib/auth/user-session";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoCallerResult =
  | { ok: true; auth: AdoCallerAuth }
  | { ok: false; auth: null; message: string };

export async function requireAdoCaller(): Promise<AdoCallerResult> {
  if (!(await hasActiveUserSession())) {
    return { ok: false, auth: null, message: ADO_SIGN_IN_REQUIRED_MESSAGE };
  }

  const auth = await resolveAdoCaller();
  if (!auth) {
    return { ok: false, auth: null, message: ADO_SIGN_IN_REQUIRED_MESSAGE };
  }

  return { ok: true, auth };
}
