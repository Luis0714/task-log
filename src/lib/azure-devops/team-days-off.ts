import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import { expandDaysOffRangeToDateKeys } from "@/lib/dashboard/non-working-days";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

type TeamDaysOffResponse = {
  daysOff?: Array<{
    start?: string;
    end?: string;
  }>;
};

function adoErrorMessage(res: Response, body: string, fallback: string): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}

/** Fechas no laborables del equipo (festivos configurados en Azure DevOps). */
export async function listTeamNonWorkingDateKeys(
  auth: AdoCallerAuth,
  team: string,
): Promise<string[]> {
  const teamName = team.trim();
  if (!teamName) return [];

  const url = `${adoProjectBase(auth)}/${encodeURIComponent(teamName)}/_apis/work/teamsettings/teamdaysoff?api-version=7.1-preview.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      adoErrorMessage(res, body, "No se pudieron cargar los días no laborables del equipo."),
    );
  }

  const data = (await res.json()) as TeamDaysOffResponse;
  const keys = new Set<string>();

  for (const range of data.daysOff ?? []) {
    const start = range.start?.trim();
    if (!start) continue;
    const end = range.end?.trim() || start;
    for (const key of expandDaysOffRangeToDateKeys(start, end)) {
      keys.add(key);
    }
  }

  return [...keys].sort();
}
