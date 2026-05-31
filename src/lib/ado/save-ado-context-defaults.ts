import "server-only";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import type { SaveAdoContextDefaultsInput } from "@/lib/schemas/ado-context-defaults";

export type SaveAdoContextDefaultsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveAdoContextDefaults(
  input: SaveAdoContextDefaultsInput,
): Promise<SaveAdoContextDefaultsResult> {
  if (!isIronSessionConfigured()) {
    return { ok: false, message: "La sesión no está configurada." };
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, message: "Inicia sesión para guardar la conexión." };
  }

  const project = input.project.trim();
  const team = input.team.trim();

  session.defaultProject = project;
  session.defaultTeam = team;

  if (isUserPersistenceReady()) {
    try {
      const updated = await getRepositories().adoConnection.updateContextDefaults(userId, {
        project,
        team,
      });

      if (!updated) {
        return { ok: false, message: "No se encontró la conexión de Azure DevOps." };
      }
    } catch {
      return { ok: false, message: "No se pudo actualizar la conexión." };
    }
  }

  await session.save();
  return { ok: true };
}
