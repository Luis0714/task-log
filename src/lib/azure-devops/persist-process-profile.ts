import "server-only";

import { buildProcessProfileForAuth } from "@/lib/azure-devops/process-profile";
import {
  applyProcessProfileToSession,
  writeProcessProfileToSession,
} from "@/lib/azure-devops/process-profile-session";
import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { TaskPilotSessionData } from "@/lib/auth/session";

/** Detecta el perfil ADO y lo adjunta a la sesión abierta (un solo save después). */
export async function attachProcessProfileOnConnect(
  session: TaskPilotSessionData,
  auth: AdoCallerAuth,
): Promise<AdoProcessProfile> {
  const profile = await buildProcessProfileForAuth(auth);
  applyProcessProfileToSession(session, auth, profile);
  return profile;
}

/** Detecta el perfil ADO del proyecto y lo guarda en la sesión del usuario. */
export async function persistProcessProfileOnConnect(
  auth: AdoCallerAuth,
): Promise<AdoProcessProfile> {
  const profile = await buildProcessProfileForAuth(auth);
  await writeProcessProfileToSession(auth, profile);
  return profile;
}
