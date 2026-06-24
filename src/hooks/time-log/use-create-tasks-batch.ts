"use client";

import { useCallback, useState } from "react";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  bulkRowSchema,
  mapBulkRowToTaskItem,
  type BulkRowFormValues,
} from "@/lib/schemas/time-log";
import type { BulkRow } from "@/lib/time-log/bulk-row";
import { BULK_ROW_LIMIT } from "@/lib/time-log/bulk-row";
import {
  createTasksBatchInAdo,
  type CreateTasksBatchApiResponse,
  type CreateTasksBatchItemResult,
} from "@/lib/time-log/create-tasks-batch-client";
import { appToast } from "@/lib/toast";

export type BulkRowSubmissionResult = {
  rowId: string;
  index: number;
  ok: boolean;
  message: string | null;
  taskId?: number;
  markedAsDone?: boolean;
};

export type UseCreateTasksBatchOptions = Readonly<{
  appendHistory: (entry: CopilotHistoryEntry) => void;
  getDefaultTaskState: () => string;
  getDefaultCompletedTaskState: () => string;
}>;

export type UseCreateTasksBatchResult = {
  submit: (
    rows: BulkRow[],
    ctx: {
      selectedPbis: Map<string, AdoWorkItemOptionDto>;
      project: string;
      team: string;
      sprintPath: string;
    },
  ) => Promise<{
    results: BulkRowSubmissionResult[];
    response: CreateTasksBatchApiResponse;
  } | null>;
  loading: boolean;
  error: string | null;
};

type ValidatedRow = {
  row: BulkRow;
  values: BulkRowFormValues;
  index: number;
};

function rowToFormValues(row: BulkRow, defaultTaskState: string): BulkRowFormValues {
  return {
    pbiId: row.pbiId,
    taskTitle: row.taskTitle,
    hours: row.hours,
    description: row.description,
    activity: row.activity,
    workingDate: row.workingDate,
    workingTime: row.workingTime,
    taskState: row.taskState || defaultTaskState,
    markAsDone: row.markAsDone,
  };
}

/**
 * Refleja la semántica time-log al payload final: si la fila tiene markAsDone
 * o no tiene estado y existe un "Done" por defecto, forzamos ese estado.
 */
function enforceTimeLogSemantics(
  values: BulkRowFormValues,
  defaultTaskState: string,
  defaultCompletedTaskState: string,
): BulkRowFormValues {
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

function validateRows(
  rows: BulkRow[],
  defaultTaskState: string,
  defaultCompletedTaskState: string,
): ValidatedRow[] {
  const validated: ValidatedRow[] = [];
  rows.forEach((row, index) => {
    const values = rowToFormValues(row, defaultTaskState);
    const parsed = bulkRowSchema.safeParse(values);
    if (parsed.success) {
      validated.push({
        row,
        values: enforceTimeLogSemantics(
          parsed.data,
          defaultTaskState,
          defaultCompletedTaskState,
        ),
        index,
      });
    }
  });
  return validated;
}

function buildTaskItems(
  rows: ValidatedRow[],
  ctx: {
    selectedPbis: Map<string, AdoWorkItemOptionDto>;
    project: string;
    team: string;
    sprintPath: string;
  },
) {
  return rows.map(({ values }) =>
    mapBulkRowToTaskItem(values, {
      pbiTitle:
        ctx.selectedPbis.get(values.pbiId)?.title ??
        `Historia #${values.pbiId}`,
      project: ctx.project,
      team: ctx.team,
      sprintPath: ctx.sprintPath,
    }),
  );
}

function appendResultsToHistory(
  response: CreateTasksBatchApiResponse,
  rowsByIndex: Map<number, BulkRow>,
  appendHistory: (entry: CopilotHistoryEntry) => void,
): void {
  const at = new Date().toISOString();
  for (const entry of response.results) {
    const row = rowsByIndex.get(entry.index);
    if (!row) continue;

    if (entry.ok) {
      const doneNote = entry.markedAsDone ? " · marcada como Done" : "";
      appendHistory({
        id: newHistoryId(entry.index),
        at,
        workingDate: row.workingDate,
        summary: `Tarea #${entry.taskId} +${entry.hours}h · Historia #${entry.pbiId}${doneNote}`,
        ok: true,
      });
      continue;
    }

    appendHistory({
      id: newHistoryId(entry.index),
      at,
      workingDate: row.workingDate,
      summary: `Tarea en historia #${entry.pbiId} +${parseHoursOrZero(row.hours)}h (falló)`,
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
    async (rows, ctx) => {
      setError(null);

      const validated = validateRows(
        rows,
        getDefaultTaskState(),
        getDefaultCompletedTaskState(),
      );

      if (validated.length === 0) {
        const message = "Completa los campos requeridos en al menos una fila.";
        setError(message);
        appToast.error(message);
        return null;
      }

      const sliceToSend = validated.slice(0, BULK_ROW_LIMIT);
      if (validated.length > BULK_ROW_LIMIT) {
        appToast.warning("Solo se enviarán los primeros 10 registros.", {
          description:
            "El servicio limita cada lote a 10 tareas. Quita filas o divide el envío.",
        });
      }

      const indexToRowId = new Map<number, string>();
      const rowsByIndex = new Map<number, BulkRow>();
      sliceToSend.forEach(({ row, index }) => {
        indexToRowId.set(index, row.id);
        rowsByIndex.set(index, row);
      });

      setLoading(true);
      try {
        const items = buildTaskItems(sliceToSend, ctx);
        const response = await createTasksBatchInAdo(items, ctx.project);

        const results: BulkRowSubmissionResult[] = response.results.map(
          (entry) => mapEntryToResult(entry, indexToRowId),
        );

        appendResultsToHistory(response, rowsByIndex, appendHistory);
        markUnprocessedRows(sliceToSend, response.results, indexToRowId, results);
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
  indexToRowId: Map<number, string>,
): BulkRowSubmissionResult {
  return {
    rowId: indexToRowId.get(entry.index) ?? "",
    index: entry.index,
    ok: entry.ok,
    message: entry.ok ? null : entry.message,
    taskId: entry.ok ? entry.taskId : undefined,
    markedAsDone: entry.ok ? entry.markedAsDone : undefined,
  };
}

/**
 * El servidor corta en el primer fallo. Las filas válidas enviadas después
 * del fallo quedan sin procesar; las marcamos como "No enviado" para que la
 * UI muestre el chip correspondiente.
 */
function markUnprocessedRows(
  sliceToSend: ValidatedRow[],
  serverResults: CreateTasksBatchItemResult[],
  indexToRowId: Map<number, string>,
  results: BulkRowSubmissionResult[],
): void {
  const processedRowIds = new Set(
    serverResults
      .map((r) => indexToRowId.get(r.index))
      .filter((id): id is string => Boolean(id)),
  );
  sliceToSend.forEach(({ row, index }) => {
    if (!processedRowIds.has(row.id)) {
      results.push({
        rowId: row.id,
        index,
        ok: false,
        message: "No enviado: la operación se detuvo en una fila anterior.",
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
