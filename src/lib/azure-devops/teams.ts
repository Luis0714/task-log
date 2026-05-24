import { adoFetch, adoOrgBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoTeam = {
  id: string;
  name: string;
};

type TeamsResponse = {
  value?: Array<{
    id?: string;
    name?: string;
  }>;
};

export async function listProjectTeams(auth: AdoCallerAuth): Promise<AdoTeam[]> {
  const url = `${adoOrgBase(auth)}/_apis/projects/${encodeURIComponent(auth.project)}/teams?api-version=7.1&$top=100`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 300) || "No se pudieron cargar los equipos del proyecto.");
  }

  const data = (await res.json()) as TeamsResponse;
  return (data.value ?? [])
    .filter((team) => team.id && team.name?.trim())
    .map((team) => ({
      id: team.id!,
      name: team.name!.trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
