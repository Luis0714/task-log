import { NextResponse } from "next/server";

import { interpretUserMessage, type SprintContext } from "@/lib/agent";
import { requireAdminOr403 } from "@/lib/auth/require-admin";
import type { ConversationTurn } from "@/lib/agent/provider/provider.types";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { getTaskPilotSession } from "@/lib/auth/session";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { CONVERSATION_HISTORY_SERVER_CAP } from "@/lib/copilot/conversation.constants";

type PreviewBody = {
  message?: string;
  sprintContext?: SprintContext;
  history?: ConversationTurn[];
  lastAssistantToolCalls?: ReadonlyArray<unknown>;
};

type SseEvent =
  | { type: "progress"; kind: string; label: string }
  | { type: "result"; ok: true; preview: unknown }
  | { type: "result"; ok: false; error: string };

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function sseChunk(encoder: TextEncoder, event: SseEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function isJsonRequest(req: Request): boolean {
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/event-stream");
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: JSON_HEADERS });
}

export async function POST(req: Request) {
  const adminGate = await requireAdminOr403();
  if (adminGate) return adminGate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(USER_MESSAGES.invalidForm, 400);
  }

  const { message, sprintContext, history, lastAssistantToolCalls } = parseBody(body);

  if (!message) {
    return jsonError(USER_MESSAGES.invalidForm, 400);
  }

  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim() ?? "";

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth && sprintContext) {
    return jsonError(USER_MESSAGES.notConnected, 401);
  }

  // Legacy JSON path: callers that explicitly opt in via Accept header.
  // Keeps the route backward compatible with anything that doesn't read SSE.
  if (isJsonRequest(req)) {
    const result = await interpretUserMessage(message, {
      userId,
      sprintContext,
      userRole: session.userRole,
      executionContext: { auth: auth ?? undefined },
      history: history?.slice(-CONVERSATION_HISTORY_SERVER_CAP),
      lastAssistantToolCalls,
    });
    if (!result.ok) {
      const status = result.userMessage === USER_MESSAGES.tooManyRequests ? 429 : 502;
      return jsonError(result.userMessage, status);
    }
    return NextResponse.json({ preview: result.preview });
  }

  // Streaming SSE path: open the stream BEFORE invoking the agent so
  // `onProgress` callbacks (which fire while the agent runs) can enqueue
  // progress events to the same stream.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SseEvent) => {
        controller.enqueue(sseChunk(encoder, event));
      };
      try {
        const result = await interpretUserMessage(message, {
          userId,
          sprintContext,
          userRole: session.userRole,
          executionContext: { auth: auth ?? undefined },
          history: history?.slice(-CONVERSATION_HISTORY_SERVER_CAP),
          lastAssistantToolCalls,
          onProgress: ({ kind, label }) => emit({ type: "progress", kind, label }),
        });
        if (!result.ok) {
          emit({ type: "result", ok: false, error: result.userMessage });
        } else {
          emit({ type: "result", ok: true, preview: result.preview });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error inesperado.";
        emit({ type: "result", ok: false, error: message });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function parseBody(raw: unknown): PreviewBody {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message : "";
  const sprintContext = parseSprintContext(obj.sprintContext);
  const history = parseHistory(obj.history);
  const lastAssistantToolCalls = Array.isArray(obj.lastAssistantToolCalls)
    ? (obj.lastAssistantToolCalls as ReadonlyArray<unknown>)
    : undefined;
  return { message, sprintContext, history, lastAssistantToolCalls };
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