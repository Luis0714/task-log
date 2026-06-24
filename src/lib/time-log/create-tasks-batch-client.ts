import type { CreateTaskBatchItem } from "@/lib/schemas/agent";

export type CreateTasksBatchItemResult =
  | {
      index: number;
      ok: true;
      taskId: number;
      pbiId: number;
      hours: number;
      completedWork: number;
      markedAsDone: boolean;
    }
  | {
      index: number;
      ok: false;
      pbiId: number;
      status: number;
      message: string;
    };

export type CreateTasksBatchApiResponse = {
  results: CreateTasksBatchItemResult[];
  successCount: number;
  failureCount: number;
  error: string | null;
};

export async function createTasksBatchInAdo(
  tasks: CreateTaskBatchItem[],
  project?: string,
): Promise<CreateTasksBatchApiResponse> {
  const res = await fetch("/api/execute/create-tasks-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks, project }),
  });

  const data = (await res.json()) as Partial<CreateTasksBatchApiResponse> & {
    error?: string;
  };

  if (!res.ok && !Array.isArray(data.results)) {
    return {
      results: [],
      successCount: 0,
      failureCount: 0,
      error: data.error ?? "No se pudieron crear los registros.",
    };
  }

  return {
    results: data.results ?? [],
    successCount: data.successCount ?? 0,
    failureCount: data.failureCount ?? 0,
    error: data.error ?? null,
  };
}
