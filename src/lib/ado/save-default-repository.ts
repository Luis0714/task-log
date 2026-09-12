import "server-only";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import type { SaveDefaultRepositoryInput } from "@/lib/schemas/ado-repository-defaults";

export type SaveDefaultRepositoryResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveDefaultRepository(
  input: SaveDefaultRepositoryInput,
): Promise<SaveDefaultRepositoryResult> {
  if (!isIronSessionConfigured()) {
    return { ok: false, message: "La sesión no está configurada." };
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, message: "Inicia sesión para guardar el repositorio." };
  }

  session.defaultRepository = input.repository.trim();
  await session.save();

  if (isUserPersistenceReady()) {
    try {
      await getRepositories().adoConnection.updateDefaultRepository(
        userId,
        session.defaultRepository,
      );
    } catch {
      // La sesión ya quedó guardada; la columna en BD puede no existir aún.
    }
  }

  return { ok: true };
}
