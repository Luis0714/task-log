import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TeamMembersResponse = {
  members: AdoTeamMemberDto[];
};

const SOURCES = new Set(["workItems", "tasks", "bugs"]);

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project")?.trim() ?? "";
  const team = searchParams.get("team")?.trim() ?? "";
  const sprintPath = searchParams.get("sprintPath")?.trim() || undefined;
  const sourceParam = searchParams.get("source")?.trim();
  const source = sourceParam && SOURCES.has(sourceParam)
    ? (sourceParam as "workItems" | "tasks" | "bugs")
    : undefined;

  if (!project || !team) {
    return NextResponse.json<TeamMembersResponse>({ members: [] });
  }

  try {
    const members = await loadTeamMembers({ project, team, sprintPath, source });
    return NextResponse.json<TeamMembersResponse>({ members });
  } catch (cause) {
    return apiErrorResponse(
      cause instanceof Error ? cause.message : "No se pudieron cargar los miembros del equipo.",
      502,
    );
  }
}