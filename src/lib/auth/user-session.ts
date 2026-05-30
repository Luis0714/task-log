import "server-only";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";

/** True si hay cuenta TaskPilot en sesión con conexión ADO guardada en BD. */
export async function hasActiveUserSession(): Promise<boolean> {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return false;
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) return false;

  try {
    const connection = await getRepositories().adoConnection.loadByUserId(userId);
    return connection !== null;
  } catch {
    return false;
  }
}
