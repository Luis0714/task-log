import "server-only";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import type { TaskPilotSessionData } from "@/lib/auth/session";
import type { LoadedAdoConnection } from "@/lib/db/ports/ado-connection.repository.port";

export type ContextDefaultsSyncResult = {
  connection: LoadedAdoConnection | null;
  changed: boolean;
};

/**
 * Aplica los defaults persistidos en `adoConnections` a la sesión cuando
 * la sesión no los trae todavía (p. ej. tras login fresco). No sobreescribe
 * defaults ya presentes en la sesión para respetar la jerarquía
 * (la sesión gana sobre la BD).
 *
 * Retorna la conexión leída (para reutilizar sin otra query a BD) y un flag
 * que indica si la sesión fue modificada.
 */
export async function applyContextDefaultsToSession(
  session: TaskPilotSessionData,
): Promise<ContextDefaultsSyncResult> {
  const empty = { connection: null, changed: false } satisfies ContextDefaultsSyncResult;

  if (!isUserPersistenceReady()) return empty;

  const userId = session.taskPilotUserId?.trim();
  if (!userId) return empty;

  let connection: LoadedAdoConnection | null;
  try {
    connection = await getRepositories().adoConnection.loadByUserId(userId);
  } catch {
    return empty;
  }

  if (!connection?.project?.trim()) {
    const repositoryChanged = await applyMissingRepository(session, userId);
    return { connection, changed: repositoryChanged };
  }

  const projectTeamChanged = hasBothDefaults(session)
    ? false
    : applyMissingDefaults(session, connection);
  const repositoryChanged = await applyMissingRepository(session, userId);

  return { connection, changed: projectTeamChanged || repositoryChanged };
}

function hasBothDefaults(session: TaskPilotSessionData): boolean {
  return (
    Boolean(session.defaultProject?.trim()) &&
    Boolean(session.defaultTeam?.trim())
  );
}

function applyMissingDefaults(
  session: TaskPilotSessionData,
  connection: LoadedAdoConnection,
): boolean {
  let changed = false;

  if (!session.defaultProject?.trim() && connection.project.trim()) {
    session.defaultProject = connection.project.trim();
    changed = true;
  }

  const dbTeam = connection.team?.trim();
  if (!session.defaultTeam?.trim() && dbTeam) {
    session.defaultTeam = dbTeam;
    changed = true;
  }

  return changed;
}

async function applyMissingRepository(
  session: TaskPilotSessionData,
  userId: string,
): Promise<boolean> {
  if (session.defaultRepository?.trim()) return false;

  try {
    const repository = await getRepositories().adoConnection.loadDefaultRepository(userId);
    if (!repository) return false;
    session.defaultRepository = repository;
    return true;
  } catch {
    return false;
  }
}