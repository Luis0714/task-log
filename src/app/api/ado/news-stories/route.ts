import "server-only";

import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { searchUserStories } from "@/lib/azure-devops/search-user-stories";
import { requireManagementUser } from "@/app/api/assignments/helpers";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { searchNewsStoriesQuerySchema } from "@/lib/schemas/news-stories";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, stories: [] },
      { status: auth.status },
    );
  }

  const url = new URL(req.url);
  const parsed = searchNewsStoriesQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload, stories: [] },
      { status: 400 },
    );
  }

  const adoCaller = await resolveAdoCaller();
  if (!adoCaller) {
    return NextResponse.json(
      {
        error: "No hay conexión activa con Azure DevOps para esta cuenta.",
        stories: [],
      },
      { status: 502 },
    );
  }

  try {
    const stories = await searchUserStories(adoCaller, {
      team: parsed.data.team ?? null,
      query: parsed.data.q,
      limit: parsed.data.limit,
    });
    return NextResponse.json({ stories });
  } catch {
    return NextResponse.json(
      { error: "No pudimos buscar HUs en Azure DevOps.", stories: [] },
      { status: 502 },
    );
  }
}
