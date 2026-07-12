import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TeamMembersResponse = {
  members: AdoTeamMemberDto[];
};

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project")?.trim() ?? "";
  const team = searchParams.get("team")?.trim() ?? "";

  if (!project || !team) {
    return NextResponse.json<TeamMembersResponse>({ members: [] });
  }

  try {
    const members = await loadTeamMembers({ project, team });
    return NextResponse.json<TeamMembersResponse>({ members });
  } catch (cause) {
    return apiErrorResponse(
      cause instanceof Error ? cause.message : "No se pudieron cargar los miembros del equipo.",
      502,
    );
  }
}