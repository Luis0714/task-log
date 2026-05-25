import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTeamIterations } from "@/lib/azure-devops/sprints";
import type { AdoTeam } from "@/lib/azure-devops/teams";

export async function resolveSuggestedTeam(
  auth: AdoCallerAuth,
  teams: AdoTeam[],
): Promise<string | null> {
  if (teams.length === 0) return null;

  let fallbackWithSprints: string | null = null;

  for (const team of teams) {
    try {
      const sprints = await listTeamIterations(auth, team.name);
      if (sprints.length === 0) continue;

      if (!fallbackWithSprints) fallbackWithSprints = team.name;

      if (sprints.some((sprint) => sprint.timeFrame === "current")) {
        return team.name;
      }
    } catch {
      continue;
    }
  }

  for (const team of teams) {
    try {
      const sprints = await listTeamIterations(auth, team.name);
      if (sprints.some((sprint) => sprint.timeFrame === "future")) {
        return team.name;
      }
    } catch {
      continue;
    }
  }

  return fallbackWithSprints ?? teams[0]?.name ?? null;
}
