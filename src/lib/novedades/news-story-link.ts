import "server-only";

import { getRepositories } from "@/lib/db";

export type SolicitudMutationResult =
  | { ok: true; workItemId: number; url: string }
  | { ok: false; status: number; message: string };

/**
 * Con equipo, el repo incluye también las HUs a nivel proyecto (teamId nulo),
 * que aplican a todos los equipos.
 */
export async function isNewsStoryLinked(
  projectId: string,
  teamId: string | null,
  workItemId: number,
): Promise<boolean> {
  const rows = await getRepositories().newsStories.list({
    projectIds: [projectId],
    teamIds: teamId ? [teamId] : undefined,
  });
  return rows.some((row) => row.workItemId === workItemId);
}
