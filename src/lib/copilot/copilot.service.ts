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

export async function interpretMessage(
  message: string,
  sprintContext: SprintContext | undefined,
  history?: ConversationTurn[],
): Promise<InterpretResponse> {
  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sprintContext: sprintContext ?? null,
        history: history?.length ? history : undefined,
      }),
    });
    const data = (await res.json()) as { preview?: PreviewResult; error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "Error al interpretar el mensaje." };
    if (!data.preview) return { ok: false, error: "No se recibió respuesta del copiloto." };
    return { ok: true, preview: data.preview };
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
