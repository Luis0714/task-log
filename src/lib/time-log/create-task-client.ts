import type { CreateTaskPayload } from "@/lib/schemas/time-log";

export type CreateTaskApiResponse = {
  success?: boolean;
  error?: string;
  detail?: string;
  taskId?: number;
  completedWork?: number;
};

export async function createTaskInAdo(
  payload: CreateTaskPayload,
): Promise<{ ok: true; taskId: number } | { ok: false; message: string }> {
  const res = await fetch("/api/execute/create-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: {
        action: payload.action,
        pbiId: payload.pbiId,
        pbiTitle: payload.pbiTitle,
        title: payload.title,
        hours: payload.hours,
        description: payload.description,
        activity: payload.activity,
        workingDate: payload.workingDate,
        state: payload.state,
        sprintPath: payload.sprintPath,
        team: payload.team,
      },
      project: payload.project,
    }),
  });

  const data = (await res.json()) as CreateTaskApiResponse;

  if (!res.ok) {
    return {
      ok: false,
      message: [data.error, data.detail].filter(Boolean).join(" — ") || "Error al ejecutar",
    };
  }

  return { ok: true, taskId: data.taskId ?? 0 };
}
