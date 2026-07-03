import "server-only";

import { adoFetch, adoProjectBase, escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { adoListErrorMessage } from "@/lib/azure-devops/wiql";

type TeamFieldValuesResponse = {
  field?: { referenceName?: string };
  values?: Array<{ value?: string; includeChildren?: boolean }>;
};

export type TeamAreaScope = {
  fieldReferenceName: string;
  values: Array<{ value: string; includeChildren: boolean }>;
};

/** Áreas configuradas del equipo (mismas que acotan su backlog y taskboard en Azure Boards). */
export async function getTeamAreaScope(
  auth: AdoCallerAuth,
  team: string,
): Promise<TeamAreaScope | null> {
  const teamName = team.trim();
  if (!teamName) return null;

  const url = `${adoProjectBase(auth)}/${encodeURIComponent(teamName)}/_apis/work/teamsettings/teamfieldvalues?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      adoListErrorMessage(res, body, "No se pudieron cargar las áreas del equipo."),
    );
  }

  const data = (await res.json()) as TeamFieldValuesResponse;
  const fieldReferenceName = data.field?.referenceName?.trim();
  if (!fieldReferenceName) return null;

  const values = (data.values ?? [])
    .map((item) => ({
      value: item.value?.trim() ?? "",
      includeChildren: item.includeChildren ?? false,
    }))
    .filter((item) => item.value.length > 0);

  if (values.length === 0) return null;

  return { fieldReferenceName, values };
}

export function buildTeamAreaWiqlCondition(scope: TeamAreaScope): string | null {
  const clauses = scope.values.map(({ value, includeChildren }) => {
    const literal = escapeWiqlString(value);
    return includeChildren
      ? `[${scope.fieldReferenceName}] UNDER '${literal}'`
      : `[${scope.fieldReferenceName}] = '${literal}'`;
  });

  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0] : `(${clauses.join(" OR ")})`;
}

/** Condición WIQL de las áreas del equipo, o null sin equipo o sin áreas configuradas. */
export async function buildTeamScopeWiqlCondition(
  auth: AdoCallerAuth,
  team: string | undefined,
): Promise<string | null> {
  const teamName = team?.trim();
  if (!teamName) return null;
  const areaScope = await getTeamAreaScope(auth, teamName);
  return areaScope ? buildTeamAreaWiqlCondition(areaScope) : null;
}
