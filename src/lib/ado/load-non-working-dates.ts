import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listTeamNonWorkingDateKeys } from "@/lib/azure-devops/team-days-off";
import { withAdoProject } from "@/lib/azure-devops/projects";

type NonWorkingDateSource = {
  dates?: readonly string[];
};

function parseNonWorkingDatesFromEnv(
  raw = process.env.AZDO_NON_WORKING_DATES,
): Set<string> {
  if (!raw?.trim()) return new Set();

  const dates = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));

  return new Set(dates);
}

function buildNonWorkingDateSet(sources: readonly NonWorkingDateSource[]): ReadonlySet<string> {
  const merged = new Set<string>();
  for (const source of sources) {
    for (const date of source.dates ?? []) {
      const key = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) merged.add(key);
    }
  }
  return merged;
}

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
