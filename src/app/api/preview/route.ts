import { NextResponse } from "next/server";

import { interpretUserMessage, type SprintContext } from "@/lib/agent";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { fetchPbiSummary } from "@/lib/azure-devops/fetch-pbi-summary";
import { getTaskPilotSession } from "@/lib/auth/session";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

type PreviewBody = {
  message?: string;
  sprintContext?: SprintContext;
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

  const { message, sprintContext } = parseBody(body);

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
    createTasksInput: sprintContext
      ? {
          kind: "create-tasks",
          message,
          sprintContext,
        }
      : undefined,
    executionContext: { auth: auth ?? undefined },
  });

  if (!result.ok) {
    const status = result.userMessage === USER_MESSAGES.tooManyRequests ? 429 : 502;
    return NextResponse.json({ error: result.userMessage }, { status });
  }

  if (result.preview.action === "create_tasks_batch" && auth) {
    const summary = await fetchPbiSummary(auth, result.preview.pbiId);
    if (summary.exists && summary.title) {
      result.preview.pbiTitle = summary.title;
    }
  }

  return NextResponse.json({ preview: result.preview });
}

function parseBody(raw: unknown): PreviewBody {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message : "";
  const sprintContext = parseSprintContext(obj.sprintContext);
  return { message, sprintContext };
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