import type { CreateTaskBatchItem, LogWorkItem, PreviewResult } from "@/lib/schemas/agent";
import type { SprintContext } from "@/lib/agent";

export type ConversationTurn = { role: "user" | "assistant"; content: string };

export type InterpretResponse =
  | { ok: true; preview: PreviewResult }
  | { ok: false; error: string };

export type LogWorkResponse = {
  results?: Array<
    | { index: number; ok: true; workItemId: number; hours: number; newCompletedWork?: number }
    | { index: number; ok: false; workItemId: number; status: number; body?: string }
  >;
  successCount?: number;
  failureCount?: number;
  error?: string;
};

export type CreateTasksResponse = {
  results?: Array<
    | {
        index: number;
        ok: true;
        taskId: number;
        pbiId: number;
        hours: number;
        completedWork: number;
        markedAsDone: boolean;
      }
    | { index: number; ok: false; pbiId: number; status: number; message: string }
  >;
  successCount?: number;
  failureCount?: number;
  error?: string;
};

type SseEvent =
  | { type: "progress"; kind: string; label: string }
  | { type: "result"; ok: true; preview: PreviewResult }
  | { type: "result"; ok: false; error: string };

export type InterpretOptions = {
  onProgress?: (payload: { kind: string; label: string }) => void;
};

export async function interpretMessage(
  message: string,
  sprintContext: SprintContext | undefined,
  history?: ConversationTurn[],
  lastAssistantToolCalls?: ReadonlyArray<unknown>,
  options?: InterpretOptions,
): Promise<InterpretResponse> {
  let res: Response;
  try {
    res = await fetch("/api/preview", {
      method: "POST",
      // Tell the route we want SSE so we can read `progress` events in
      // real time. The route still falls back to a JSON response for
      // callers that explicitly accept `application/json`.
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        message,
        sprintContext: sprintContext ?? null,
        history: history?.length ? history : undefined,
        ...(lastAssistantToolCalls ? { lastAssistantToolCalls } : {}),
      }),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? "Error al interpretar el mensaje." };
  }

  if (!res.body) {
    return { ok: false, error: "No se recibió respuesta del servidor." };
  }

  return await consumeSseStream(res.body, options);
}

/**
 * Consume el stream SSE de `/api/preview` y devuelve el `InterpretResponse`
 * final. Extraído de `interpretMessage` para bajar la complejidad
 * cognitiva y hacerlo testeable de forma aislada.
 */
async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  options: InterpretOptions | undefined,
): Promise<InterpretResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: InterpretResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const remaining = processSseBuffer(buffer, options, finalResult);
    buffer = remaining.buffer;
    if (remaining.done) {
      return (
        remaining.result ?? {
          ok: false,
          error: "No se recibió respuesta del copiloto.",
        }
      );
    }
    if (remaining.result) finalResult = remaining.result;
  }

  return finalResult ?? { ok: false, error: "No se recibió respuesta del copiloto." };
}

type SseProcessResult = {
  buffer: string;
  result?: InterpretResponse;
  done: boolean;
};

function processSseBuffer(
  buffer: string,
  options: InterpretOptions | undefined,
  currentResult: InterpretResponse | null,
): SseProcessResult {
  const lines = buffer.split("\n");
  const newBuffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") {
      return {
        buffer: newBuffer,
        done: true,
        result: currentResult ?? {
          ok: false,
          error: "No se recibió respuesta del copiloto.",
        },
      };
    }
    const event = parseSseEvent(data);
    if (!event) continue;
    if (event.type === "progress") {
      options?.onProgress?.({ kind: event.kind, label: event.label });
    } else {
      // event.type === "result"
      const result: InterpretResponse = event.ok
        ? { ok: true, preview: event.preview }
        : { ok: false, error: event.error };
      return { buffer: newBuffer, result, done: false };
    }
  }

  return { buffer: newBuffer, done: false };
}

function parseSseEvent(data: string): SseEvent | null {
  try {
    return JSON.parse(data) as SseEvent;
  } catch {
    return null;
  }
}

export async function executeLogWork(items: LogWorkItem[]): Promise<LogWorkResponse> {
  const body =
    items.length === 1
      ? { action: "log_work", preview: items[0] }
      : { action: "log_work_batch", previews: items };

  try {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as LogWorkResponse;
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function executeCreateTasks(tasks: CreateTaskBatchItem[]): Promise<CreateTasksResponse> {
  try {
    const res = await fetch("/api/execute/create-tasks-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    return (await res.json()) as CreateTasksResponse;
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}
