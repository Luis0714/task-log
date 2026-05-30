import "server-only";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import type { TaskPilotSessionData } from "@/lib/auth/session";

/** Persiste rotación de refresh token cuando el usuario tiene cuenta Entra en BD. */
export async function syncOAuthRefreshToDatabase(
  session: TaskPilotSessionData,
  refreshToken: string,
): Promise<void> {
  const userId = session.taskPilotUserId?.trim();
  if (!userId || !isUserPersistenceReady()) return;

  try {
    await getRepositories().entraUser.updateOAuthRefreshToken(userId, refreshToken);
  } catch {
    // La sesión en cookie sigue válida aunque falle la sincronización con BD.
  }
}
