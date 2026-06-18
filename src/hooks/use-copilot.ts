"use client";

import { useCallback, useState } from "react";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import type { SprintContext } from "@/lib/agent";
import type {
  CreateTaskBatchItem,
  LogWorkItem,
  PreviewResult,
} from "@/lib/schemas/agent";

type UseCopilotOptions = {
  appendHistory: (entry: CopilotHistoryEntry) => void;
  sprintContext?: SprintContext;
};

type ExecuteApiResponse = {
  results?: Array<
    | { index: number; ok: true; workItemId: number; hours: number; newCompletedWork?: number }
    | { index: number; ok: false; workItemId: number; status: number; body?: string }
  >;
  successCount?: number;
  failureCount?: number;
  error?: string;
};

type CreateTasksApiResponse = {
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

function buildBatchSummary(items: LogWorkItem[]): string {
  const ids = items.map((i) => `#${i.workItemId}`).join(", ");
  const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
  return `Elementos ${ids} +${totalHours}h`;
}

function buildCreateTasksSummary(args: {
  pbiId: number;
  successCount: number;
  totalTasks: number;
  totalHours: number;
  failureCount: number;
  firstError: string | null | undefined;
}): string {
  const { pbiId, successCount, totalTasks, totalHours, failureCount, firstError } = args;
  if (failureCount === 0) {
    return `PBI #${pbiId}: ${successCount} tasks creadas +${totalHours}h, todas Done`;
  }
  const failurePart = `${successCount}/${totalTasks} ok, ${failureCount} fallaron`;
  const errorPart = firstError ? ` (${firstError})` : "";
  return `PBI #${pbiId}: ${failurePart}${errorPart}`;
}

export function useCopilot({ appendHistory, sprintContext }: UseCopilotOptions) {
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);

  const callInterpret = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    setPreview(null);
    setLoadingPreview(true);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sprintContext: sprintContext ?? null,
        }),
      });
      const data = (await res.json()) as { preview?: PreviewResult; error?: string };

      if (!res.ok) {
        setError(data.error ?? USER_MESSAGES.copilotInterpret);
        return;
      }

      if (data.preview) setPreview(data.preview);
    } catch {
      setError(USER_MESSAGES.genericRetry);
    } finally {
      setLoadingPreview(false);
    }
  }, [sprintContext]);

  const interpret = useCallback(async () => {
    return callInterpret(message);
  }, [callInterpret, message]);

  /**
   * El usuario eligió una PBI candidata desde la clarificación. Re-interpretamos
   * con la intención original + la PBI ya confirmada para que el runner emita el
   * `create_tasks_batch` sin volver a preguntar.
   */
  const refineWithPbiId = useCallback(
    async (pbiId: number) => {
      const base = message.trim();
      const refined = base
        ? `${base} (usa la PBI #${pbiId})`
        : `Usa la PBI #${pbiId}`;
      setMessage(refined);
      return callInterpret(refined);
    },
    [callInterpret, message],
  );

  const executeLogWork = useCallback(
    async (items: LogWorkItem[]) => {
      if (items.length === 0) return;
      setError(null);
      setLoadingExecute(true);

      const isBatch = items.length > 1;
      const body =
        items.length === 1
          ? { action: "log_work", preview: items[0] }
          : { action: "log_work_batch", previews: items };

      const baseSummary = buildBatchSummary(items);

      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as ExecuteApiResponse;

        if (!res.ok) {
          setError(data.error ?? USER_MESSAGES.saveFailed);
          appendHistory({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            summary: `${baseSummary} (falló)`,
            ok: false,
          });
          return;
        }

        const results = data.results ?? [];
        const successCount = data.successCount ?? 0;
        const failureCount = data.failureCount ?? 0;
        const successIds = results
          .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
          .map((r) => `#${r.workItemId}`)
          .join(", ");
        const totalNewHours = results
          .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
          .reduce((sum, r) => sum + r.hours, 0);

        const okSummary = isBatch
          ? `${successIds} +${totalNewHours}h · ${successCount} ok, ${failureCount} fallaron`
          : `Elemento #${items[0]!.workItemId} +${items[0]!.hours}h · Total: ${results[0]?.ok ? (results[0] as Extract<typeof results[0], { ok: true }>).newCompletedWork ?? "—" : "—"}h`;

        if (failureCount > 0 && successCount === 0) {
          setError(USER_MESSAGES.saveFailed);
        }

        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary: `${okSummary}${failureCount > 0 ? " (parcial)" : ""}`,
          ok: failureCount === 0,
        });

        if (failureCount === 0) {
          setPreview(null);
          setMessage("");
        }
      } catch {
        setError(USER_MESSAGES.genericRetry);
      } finally {
        setLoadingExecute(false);
      }
    },
    [appendHistory],
  );

  const executeCreateTasks = useCallback(
    async (tasks: CreateTaskBatchItem[]) => {
      if (tasks.length === 0) return;
      setError(null);
      setLoadingExecute(true);

      const pbiId = tasks[0].pbiId;
      const totalHours = tasks.reduce((sum, t) => sum + t.hours, 0);

      try {
        const res = await fetch("/api/execute/create-tasks-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks }),
        });
        const data = (await res.json()) as CreateTasksApiResponse;

        if (!res.ok) {
          setError(data.error ?? USER_MESSAGES.taskCreateFailed);
          appendHistory({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            summary: `PBI #${pbiId} (${tasks.length} tasks, falló)`,
            ok: false,
          });
          return;
        }

        const successCount = data.successCount ?? 0;
        const failureCount = data.failureCount ?? 0;

        if (failureCount > 0) {
          const partialSummary =
            successCount > 0
              ? `${successCount} ok, ${failureCount} fallaron — revisa el historial.`
              : data.error ?? USER_MESSAGES.taskCreateFailed;
          setError(partialSummary);
        }

        const summary = buildCreateTasksSummary({
          pbiId,
          successCount,
          totalTasks: tasks.length,
          totalHours,
          failureCount,
          firstError: data.error,
        });

        appendHistory({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          summary,
          ok: failureCount === 0,
        });

        if (failureCount === 0) {
          setPreview(null);
          setMessage("");
        }
      } catch {
        setError(USER_MESSAGES.genericRetry);
      } finally {
        setLoadingExecute(false);
      }
    },
    [appendHistory],
  );

  const dismissPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    message,
    setMessage,
    preview,
    error,
    loadingPreview,
    loadingExecute,
    interpret,
    refineWithPbiId,
    execute: executeLogWork,
    executeCreateTasks,
    dismissPreview,
    clearError,
  };
}