import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoTeamMember = {
  id: string;
  displayName: string;
  uniqueName: string;
};

export type AdoTeam = {
  id: string;
  name: string;
};

type TeamsResponse = { value?: Array<{ id?: string; name?: string }> };
type MembersResponse = {
  value?: Array<{
    identity?: { id?: string; displayName?: string; uniqueName?: string };
  }>;
};

async function listTeamsForProject(
  auth: AdoCallerAuth,
): Promise<AdoTeam[]> {
  const url = `${adoProjectBase(auth)}/_apis/teams?api-version=7.1&$top=100`;
  const res = await adoFetch(auth, url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 300) || "No se pudieron cargar los equipos.");
  }
  const data = (await res.json()) as TeamsResponse;
  return (data.value ?? [])
    .filter((t): t is { id: string; name: string } => Boolean(t.id && t.name))
    .map((t) => ({ id: t.id, name: t.name.trim() }));
}

export async function listProjectTeamsCached(
  auth: AdoCallerAuth,
): Promise<AdoTeam[]> {
  return listTeamsForProject(auth);
}

export async function listTeamMembers(
  auth: AdoCallerAuth,
  teamId: string,
): Promise<AdoTeamMember[]> {
  const url = `${adoProjectBase(auth)}/_apis/teams/${encodeURIComponent(teamId)}/members?api-version=7.1`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return [];
  const data = (await res.json()) as MembersResponse;
  return (data.value ?? [])
    .map((m) => m.identity)
    .filter(
      (i): i is { id: string; displayName: string; uniqueName: string } =>
        Boolean(i?.id && i.displayName && i.uniqueName),
    )
    .map((i) => ({
      id: i.id,
      displayName: i.displayName.trim(),
      uniqueName: i.uniqueName.trim(),
    }));
}

/** Devuelve los miembros únicos (por `id`) de los equipos del proyecto. */
export async function listProjectTeamMembers(
  auth: AdoCallerAuth,
): Promise<AdoTeamMember[]> {
  const teams = await listTeamsForProject(auth);
  const all = await Promise.all(teams.map((t) => listTeamMembers(auth, t.id)));
  const seen = new Map<string, AdoTeamMember>();
  for (const members of all) {
    for (const m of members) {
      if (!seen.has(m.id)) seen.set(m.id, m);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es"),
  );
}
