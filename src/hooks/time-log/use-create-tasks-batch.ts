"use client";

import { useCallback, useState } from "react";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  bulkTaskSchema,
  mapBulkTaskToTaskItem,
  type BulkTaskFormValues,
} from "@/lib/schemas/time-log";
import type { BulkGroup, BulkTask } from "@/lib/time-log/bulk-group";
import { BULK_GROUP_LIMIT } from "@/lib/time-log/bulk-group";
import {
  createTasksBatchInAdo,
  type CreateTasksBatchApiResponse,
  type CreateTasksBatchItemResult,
} from "@/lib/time-log/create-tasks-batch-client";
import { appToast } from "@/lib/toast";

export type TaskSubmissionResult = {
  groupId: string;
  taskId: string;
  index: number;
  ok: boolean;
  message: string | null;
  taskIdRemote?: number;
  markedAsDone?: boolean;
};

export type UseCreateTasksBatchOptions = Readonly<{
  appendHistory: (entry: CopilotHistoryEntry) => void;
  getDefaultTaskState: () => string;
  getDefaultCompletedTaskState: () => string;
}>;

export type UseCreateTasksBatchResult = {
  submit: (
    groups: BulkGroup[],
    ctx: {
      selectedPbis: Map<string, AdoWorkItemOptionDto>;
      project: string;
      team: string;
      sprintPath: string;
    },
  ) => Promise<{
    results: TaskSubmissionResult[];
    response: CreateTasksBatchApiResponse;
  } | null>;
  loading: boolean;
  error: string | null;
};

type ValidatedTask = {
  group: BulkGroup;
  task: BulkTask;
  values: BulkTaskFormValues;
  /** Índice dentro del batch aplanado (lo que espera la API). */
  index: number;
};

function taskToFormValues(
  task: BulkTask,
  defaultTaskState: string,
): BulkTaskFormValues {
  return {
    taskTitle: task.taskTitle,
    hours: task.hours,
    description: task.description,
    activity: task.activity,
    workingDate: task.workingDate,
    workingTime: task.workingTime,
    taskState: task.taskState || defaultTaskState,
    markAsDone: task.markAsDone,
  };
}

/**
 * Refleja la semántica time-log al payload final: si la tarea tiene
 * markAsDone o no tiene estado y existe un "Done" por defecto, forzamos
 * ese estado.
 */
function enforceTimeLogSemantics(
  values: BulkTaskFormValues,
  defaultTaskState: string,
  defaultCompletedTaskState: string,
): BulkTaskFormValues {
  const shouldMarkDone =
    values.markAsDone || (!values.taskState && !!defaultCompletedTaskState);
  return {
    ...values,
    markAsDone: shouldMarkDone,
    taskState:
      values.markAsDone && defaultCompletedTaskState
        ? defaultCompletedTaskState
        : values.taskState || defaultTaskState,
  };
}

/**
 * Aplana `BulkGroup[]` a una lista de tareas validadas en el orden en que
 * se enviarán a la API. Descarta grupos sin `pbiId` (no seleccionados) y
 * tareas que no pasen `bulkTaskSchema`. Devuelve también el índice que cada
 * tarea ocupará en el batch.
 */
function validateGroups(
  groups: BulkGroup[],
  defaultTaskState: string,
  defaultCompletedTaskState: string,
): ValidatedTask[] {
  const validated: ValidatedTask[] = [];
  let index = 0;
  for (const group of groups) {
    if (!group.pbiId) continue;
    for (const task of group.tasks) {
      const values = taskToFormValues(task, defaultTaskState);
      const parsed = bulkTaskSchema.safeParse(values);
      if (parsed.success) {
        validated.push({
          group,
          task,
          values: enforceTimeLogSemantics(
            parsed.data,
            defaultTaskState,
            defaultCompletedTaskState,
          ),
          index,
        });
        index += 1;
      }
    }
  }
  return validated;
}

function buildTaskItems(
  validated: ValidatedTask[],
  ctx: {
    selectedPbis: Map<string, AdoWorkItemOptionDto>;
    project: string;
    team: string;
    sprintPath: string;
  },
) {
  return validated.map(({ values, group }) =>
    mapBulkTaskToTaskItem(values, {
      pbiId: group.pbiId,
      pbiTitle:
        ctx.selectedPbis.get(group.pbiId)?.title ??
        `Historia #${group.pbiId}`,
      project: ctx.project,
      team: ctx.team,
      sprintPath: ctx.sprintPath,
    }),
  );
}

function appendResultsToHistory(
  response: CreateTasksBatchApiResponse,
  tasksByIndex: Map<number, ValidatedTask>,
  appendHistory: (entry: CopilotHistoryEntry) => void,
): void {
  const at = new Date().toISOString();
  for (const entry of response.results) {
    const item = tasksByIndex.get(entry.index);
    if (!item) continue;

    if (entry.ok) {
      const doneNote = entry.markedAsDone ? " · marcada como Done" : "";
      appendHistory({
        id: newHistoryId(entry.index),
        at,
        workingDate: item.task.workingDate,
        summary: `Tarea #${entry.taskId} +${entry.hours}h · Historia #${item.group.pbiId}${doneNote}`,
        ok: true,
      });
      continue;
    }

    appendHistory({
      id: newHistoryId(entry.index),
      at,
      workingDate: item.task.workingDate,
      summary: `Tarea en historia #${item.group.pbiId} +${parseHoursOrZero(item.task.hours)}h (falló)`,
      ok: false,
    });
  }
}

function showResultToast(response: CreateTasksBatchApiResponse): void {
  if (response.failureCount === 0) {
    appToast.success(
      response.successCount === 1
        ? "Tarea creada en Azure DevOps."
        : `Tareas creadas: ${response.successCount}`,
    );
    return;
  }
  const description =
    response.error ??
    (response.successCount > 0
      ? `Se crearon ${response.successCount} antes de la primera falla.`
      : undefined);
  appToast.error(
    response.successCount > 0
      ? "Algunas tareas no se pudieron crear."
      : "No se pudo crear ninguna tarea.",
    description ? { description } : undefined,
  );
}

export function useCreateTasksBatch({
  appendHistory,
  getDefaultTaskState,
  getDefaultCompletedTaskState,
}: UseCreateTasksBatchOptions): UseCreateTasksBatchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback<UseCreateTasksBatchResult["submit"]>(
    async (groups, ctx) => {
      setError(null);

      const validated = validateGroups(
        groups,
        getDefaultTaskState(),
        getDefaultCompletedTaskState(),
      );

      if (validated.length === 0) {
        const message = "Completa los campos requeridos en al menos una tarea.";
        setError(message);
        appToast.error(message);
        return null;
      }

      const sliceToSend = validated.slice(0, BULK_GROUP_LIMIT);
      if (validated.length > BULK_GROUP_LIMIT) {
        appToast.warning(
          `Solo se enviarán las primeras ${BULK_GROUP_LIMIT} tareas.`,
          {
            description:
              "El servicio limita cada lote. Quita tareas o divide el envío.",
          },
        );
      }

      const tasksByIndex = new Map<number, ValidatedTask>();
      const indexToTaskId = new Map<number, { groupId: string; taskId: string }>();
      sliceToSend.forEach((item) => {
        tasksByIndex.set(item.index, item);
        indexToTaskId.set(item.index, {
          groupId: item.group.id,
          taskId: item.task.id,
        });
      });

      setLoading(true);
      try {
        const items = buildTaskItems(sliceToSend, ctx);
        const response = await createTasksBatchInAdo(items, ctx.project);

        const results: TaskSubmissionResult[] = response.results.map((entry) =>
          mapEntryToResult(entry, indexToTaskId),
        );

        appendResultsToHistory(response, tasksByIndex, appendHistory);
        markUnprocessedTasks(sliceToSend, response.results, indexToTaskId, results);
        showResultToast(response);

        return { results, response };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo ejecutar el envío.";
        setError(message);
        appToast.error("Error al enviar los registros.", {
          description: message,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [appendHistory, getDefaultCompletedTaskState, getDefaultTaskState],
  );

  return { submit, loading, error };
}

function mapEntryToResult(
  entry: CreateTasksBatchItemResult,
  indexToTaskId: Map<number, { groupId: string; taskId: string }>,
): TaskSubmissionResult {
  const ids = indexToTaskId.get(entry.index);
  return {
    groupId: ids?.groupId ?? "",
    taskId: ids?.taskId ?? "",
    index: entry.index,
    ok: entry.ok,
    message: entry.ok ? null : entry.message,
    taskIdRemote: entry.ok ? entry.taskId : undefined,
    markedAsDone: entry.ok ? entry.markedAsDone : undefined,
  };
}

/**
 * El servidor corta en el primer fallo. Las tareas válidas enviadas después
 * del fallo quedan sin procesar; las marcamos como "No enviado" para que la
 * UI muestre el chip correspondiente.
 */
function markUnprocessedTasks(
  sliceToSend: ValidatedTask[],
  serverResults: CreateTasksBatchItemResult[],
  indexToTaskId: Map<number, { groupId: string; taskId: string }>,
  results: TaskSubmissionResult[],
): void {
  const processedKeys = new Set(
    serverResults
      .map((r) => indexToTaskId.get(r.index))
      .filter((id): id is { groupId: string; taskId: string } => Boolean(id))
      .map((ids) => `${ids.groupId}|${ids.taskId}`),
  );
  sliceToSend.forEach((item) => {
    const key = `${item.group.id}|${item.task.id}`;
    if (!processedKeys.has(key)) {
      results.push({
        groupId: item.group.id,
        taskId: item.task.id,
        index: item.index,
        ok: false,
        message: "No enviado: la operación se detuvo en una tarea anterior.",
      });
    }
  });
}

function parseHoursOrZero(raw: string): number {
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function newHistoryId(index: number): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hist-${Date.now()}-${index}`;
}
