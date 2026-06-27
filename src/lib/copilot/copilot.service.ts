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
  | { type: "progress"; label: string }
  | { type: "result"; ok: true; preview: PreviewResult }
  | { type: "result"; ok: false; error: string };

export type InterpretOptions = {
  onProgress?: (label: string) => void;
};

export async function interpretMessage(
  message: string,
  sprintContext: SprintContext | undefined,
  history?: ConversationTurn[],
  options?: InterpretOptions,
): Promise<InterpretResponse> {
  try {
    const res = await fetch("/api/preview", {
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
      }),
    });

    if (!res.ok) {
      // Error responses are still JSON — try to extract a user-facing message.
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error ?? "Error al interpretar el mensaje." };
    }

    if (!res.body) {
      return { ok: false, error: "No se recibió respuesta del servidor." };
    }

    // SSE stream: read `data: {…}\n\n` chunks until `[DONE]`.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: InterpretResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          return finalResult ?? { ok: false, error: "No se recibió respuesta del copiloto." };
        }
        try {
          const event = JSON.parse(data) as SseEvent;
          if (event.type === "progress") {
            options?.onProgress?.(event.label);
          } else if (event.type === "result") {
            finalResult = event.ok
              ? { ok: true, preview: event.preview }
              : { ok: false, error: event.error };
          }
        } catch {
          // ignore malformed event lines
        }
      }
    }

    return finalResult ?? { ok: false, error: "No se recibió respuesta del copiloto." };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta de nuevo." };
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
