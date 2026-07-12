import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { requireManagementUser } from "@/app/api/assignments/helpers";
import {
  linkNewsStoryBodySchema,
  newsStoriesFilterSchema,
} from "@/lib/schemas/news-stories";
import { validateLinkNewsStory } from "@/lib/news-stories/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const projectsRaw = url.searchParams.get("projects") ?? "";
  const teamsRaw = url.searchParams.get("teams") ?? "";
  const legacyProject = url.searchParams.get("projectId") ?? "";
  const legacyTeam = url.searchParams.get("teamId") ?? "";
  const parsedFilter = newsStoriesFilterSchema.safeParse({
    projects: projectsRaw
      ? projectsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : legacyProject
        ? [legacyProject]
        : [],
    teams: teamsRaw
      ? teamsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : legacyTeam
        ? [legacyTeam]
        : [],
  });
  if (!parsedFilter.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const repo = getRepositories().newsStories;
  const rows = await repo.list({
    projectIds: parsedFilter.data.projects,
    teamIds: parsedFilter.data.teams,
  });
  return NextResponse.json({ stories: rows });
}

export async function POST(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidJsonBody },
      { status: 400 },
    );
  }

  const parsed = linkNewsStoryBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const validation = validateLinkNewsStory({
    projectId: parsed.data.projectId,
    teamId: parsed.data.teamId ?? "",
    workItemId: parsed.data.workItemId,
    workItemTitle: parsed.data.workItemTitle ?? null,
    linkedByUserId: auth.userId,
  });
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error.message, code: validation.error.code },
      { status: 400 },
    );
  }

  const repo = getRepositories().newsStories;
  try {
    const row = await repo.create(validation.input);
    return NextResponse.json({ story: row }, { status: 201 });
  } catch (e) {
    if (isDuplicateError(e)) {
      return NextResponse.json(
        {
          error: "Esta HU ya está vinculada a este (proyecto, equipo).",
          code: "duplicate",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "No pudimos guardar la HU de novedad." },
      { status: 500 },
    );
  }
}

function isDuplicateError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return (
    e.message.toLowerCase().includes("unique") ||
    e.message.toLowerCase().includes("duplicate") ||
    e.message.toLowerCase().includes("unique_link")
  );
}
