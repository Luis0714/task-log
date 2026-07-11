import "server-only";

import { NextResponse } from "next/server";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { searchUserStories } from "@/lib/azure-devops/search-user-stories";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { searchNewsStoriesQuerySchema } from "@/lib/schemas/news-stories";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return NextResponse.json(
      { error: caller.message, stories: [] },
      { status: 401 },
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

  try {
    const stories = await searchUserStories(caller.auth, {
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
