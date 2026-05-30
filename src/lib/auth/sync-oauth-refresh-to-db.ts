import "server-only";

import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";
import { updateEntraOAuthRefreshToken } from "@/lib/db/repositories/entra-user.repository";
import type { TaskPilotSessionData } from "@/lib/auth/session";

/** Persiste rotación de refresh token cuando el usuario tiene cuenta Entra en BD. */
export async function syncOAuthRefreshToDatabase(
  session: TaskPilotSessionData,
  refreshToken: string,
): Promise<void> {
  const userId = session.taskPilotUserId?.trim();
  if (!userId || !isUserPersistenceReady()) return;

  try {
    await updateEntraOAuthRefreshToken(userId, refreshToken);
  } catch {
    // La sesión en cookie sigue válida aunque falle la sincronización con BD.
  }
}
