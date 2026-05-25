import "server-only";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoCallerResult =
  | { ok: true; auth: AdoCallerAuth }
  | { ok: false; auth: null };

export async function requireAdoCaller(): Promise<AdoCallerResult> {
  const auth = await resolveAdoCaller();
  if (!auth) return { ok: false, auth: null };
  return { ok: true, auth };
}
