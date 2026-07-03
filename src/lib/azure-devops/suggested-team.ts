import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTeamIterations } from "@/lib/azure-devops/sprints";
import type { AdoTeam } from "@/lib/azure-devops/teams";

export async function resolveSuggestedTeam(
  auth: AdoCallerAuth,
  teams: AdoTeam[],
): Promise<string | null> {
  if (teams.length === 0) return null;

  const iterationsByTeam = await Promise.all(
    teams.map(async (team) => {
      try {
        return await listTeamIterations(auth, team.name);
      } catch {
        return [];
      }
    }),
  );

  let withCurrentSprint: string | null = null;
  let withFutureSprint: string | null = null;
  let fallbackWithSprints: string | null = null;

  teams.forEach((team, index) => {
    const sprints = iterationsByTeam[index];
    if (sprints.length === 0) return;

    if (!fallbackWithSprints) fallbackWithSprints = team.name;
    if (!withCurrentSprint && sprints.some((sprint) => sprint.timeFrame === "current")) {
      withCurrentSprint = team.name;
    }
    if (!withFutureSprint && sprints.some((sprint) => sprint.timeFrame === "future")) {
      withFutureSprint = team.name;
    }
  });

  return (
    withCurrentSprint ?? withFutureSprint ?? fallbackWithSprints ?? teams[0]?.name ?? null
  );
}
