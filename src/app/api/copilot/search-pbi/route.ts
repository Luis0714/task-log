import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { searchPbiByText } from "@/lib/azure-devops/search-pbi-by-text";
import { getTaskPilotSession } from "@/lib/auth/session";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

type SearchPbiBody = {
  query?: string;
  sprintPath?: string;
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidForm },
      { status: 400 },
    );
  }

  const { query, sprintPath } = parseBody(body);
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ candidates: [] });
  }

  const session = await getTaskPilotSession();
  if (!session.taskPilotUserId) {
    return NextResponse.json({ candidates: [] });
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json({ candidates: [] });
  }

  const hits = await searchPbiByText(auth, query, sprintPath);
  return NextResponse.json({
    candidates: hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      state: hit.state,
    })),
  });
}

function parseBody(raw: unknown): SearchPbiBody {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  return {
    query: typeof obj.query === "string" ? obj.query : undefined,
    sprintPath: typeof obj.sprintPath === "string" ? obj.sprintPath : undefined,
  };
}