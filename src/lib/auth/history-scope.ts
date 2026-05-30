import "server-only";

import { getTaskPilotSession } from "@/lib/auth/session";

/** Clave estable para aislar el historial local por cuenta conectada. */
export async function getHistoryScopeKey(): Promise<string | null> {
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (userId) return userId;

  const adoProfileId = session.adoProfile?.id?.trim();
  if (adoProfileId) return `ado:${adoProfileId}`;

  return null;
}
