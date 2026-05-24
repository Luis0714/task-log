import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listTeamIterations } from "@/lib/azure-devops/sprints";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { listProjectTeams, type AdoTeam } from "@/lib/azure-devops/teams";

async function resolveSuggestedTeam(
  auth: ReturnType<typeof withAdoProject>,
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

export async function GET(req: Request) {
  const project = new URL(req.url).searchParams.get("project")?.trim();
  if (!project) {
    return NextResponse.json({ error: "Falta el parámetro project." }, { status: 400 });
  }

  if (project.length > 200) {
    return NextResponse.json({ error: "project demasiado largo." }, { status: 400 });
  }

  const auth = await resolveAdoCaller();
  if (!auth) {
    const error = isPatAuthMethod()
      ? "No hay conexión con Azure DevOps. Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT."
      : isOAuthAuthMethod()
        ? "No hay conexión con Azure DevOps. Conecta tu cuenta con OAuth."
        : "No hay conexión con Azure DevOps.";
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const scopedAuth = withAdoProject(auth, project);
    const teams = await listProjectTeams(scopedAuth);
    const suggestedTeam = await resolveSuggestedTeam(scopedAuth, teams);
    const envTeam = process.env.AZDO_TEAM?.trim();
    const defaultTeam =
      envTeam && teams.some((team) => team.name === envTeam) ? envTeam : undefined;

    return NextResponse.json({ teams, suggestedTeam, defaultTeam });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los equipos.", detail },
      { status: 502 },
    );
  }
}
