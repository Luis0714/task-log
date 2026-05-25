import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listTeamNonWorkingDateKeys } from "@/lib/azure-devops/team-days-off";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  buildNonWorkingDateSet,
  parseNonWorkingDatesFromEnv,
} from "@/lib/dashboard/non-working-days";

export const loadNonWorkingDates = cache(async function loadNonWorkingDates(
  project: string,
  team: string,
): Promise<string[]> {
  if (!project || !team) return [];

  const caller = await requireAdoCaller();
  if (!caller.ok) return [];

  try {
    const envDates = [...parseNonWorkingDatesFromEnv()];
    const teamDates = await listTeamNonWorkingDateKeys(
      withAdoProject(caller.auth, project),
      team,
    ).catch(() => [] as string[]);
    return [...buildNonWorkingDateSet([{ dates: envDates }, { dates: teamDates }])];
  } catch {
    return [];
  }
});
