import { NextResponse } from "next/server";

import { interpretUserMessage, type SprintContext } from "@/lib/agent";
import type { ConversationTurn } from "@/lib/agent/provider/provider.types";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { getTaskPilotSession } from "@/lib/auth/session";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { CONVERSATION_HISTORY_SERVER_CAP } from "@/lib/copilot/conversation.constants";

type PreviewBody = {
  message?: string;
  sprintContext?: SprintContext;
  history?: ConversationTurn[];
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

  const { message, sprintContext, history } = parseBody(body);

  if (!message) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidForm },
      { status: 400 },
    );
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim() ?? "";

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth && sprintContext) {
    return NextResponse.json(
      { error: USER_MESSAGES.notConnected },
      { status: 401 },
    );
  }

  const result = await interpretUserMessage(message, {
    userId,
    sprintContext,
    userRole: session.userRole,
    executionContext: { auth: auth ?? undefined },
    history: history?.slice(-CONVERSATION_HISTORY_SERVER_CAP),
  });

  if (!result.ok) {
    const status = result.userMessage === USER_MESSAGES.tooManyRequests ? 429 : 502;
    return NextResponse.json({ error: result.userMessage }, { status });
  }

  return NextResponse.json({ preview: result.preview });
}

function parseBody(raw: unknown): PreviewBody {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message : "";
  const sprintContext = parseSprintContext(obj.sprintContext);
  const history = parseHistory(obj.history);
  return { message, sprintContext, history };
}

function parseHistory(raw: unknown): ConversationTurn[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const turns: ConversationTurn[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const turn = item as Record<string, unknown>;
    const role = turn.role;
    if ((role !== "user" && role !== "assistant") || typeof turn.content !== "string") continue;
    turns.push({ role, content: turn.content });
  }
  return turns;
}

function parseSprintContext(raw: unknown): SprintContext | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  const project = obj.project;
  const team = obj.team;
  const sprintPath = obj.sprintPath;
  const sprintStartDate = obj.sprintStartDate;
  const sprintFinishDate = obj.sprintFinishDate;
  const nonWorkingDates = Array.isArray(obj.nonWorkingDates)
    ? obj.nonWorkingDates.filter((d): d is string => typeof d === "string")
    : [];
  if (
    typeof project !== "string" ||
    typeof team !== "string" ||
    typeof sprintPath !== "string" ||
    typeof sprintStartDate !== "string" ||
    typeof sprintFinishDate !== "string"
  ) {
    return undefined;
  }
  return {
    project,
    team,
    sprintPath,
    sprintStartDate,
    sprintFinishDate,
    nonWorkingDates,
  };
}