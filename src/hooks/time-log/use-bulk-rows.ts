"use client";

import { useCallback, useId, useMemo, useState } from "react";

import { bulkRowSchema } from "@/lib/schemas/time-log";
import {
  getDefaultWorkingDate,
  getDefaultWorkingTime,
} from "@/lib/time-log/task-constants";
import {
  BULK_ROW_LIMIT,
  type BulkRow,
  type BulkRowResult,
} from "@/lib/time-log/bulk-row";

export type UseBulkRowsOptions = {
  isTaskCreationMode: boolean;
  defaultTaskState?: string;
  /**
   * Actividad por defecto para filas nuevas. Si el proyecto requiere Activity
   * y el usuario deja el select vacío, ADO rechaza con TF401320. Pre-poblar
   * con la primera actividad disponible evita el 422 sin obligar al usuario a
   * seleccionar manualmente cuando sólo quiere registrar horas rápidas.
   */
  defaultActivity?: string;
  /** ID de la fila que arranca expandida. Default: id de la primera fila. */
  initialOpenId?: string;
};

export type RowValidation =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export type TryAddRowResult =
  | { added: true; newRowId: string }
  | { added: false; errors: Record<string, string>; blockedRowId: string };

export type UseBulkRowsResult = {
  rows: BulkRow[];
  /** ID de la fila actualmente expandida (o null si ninguna). */
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /**
   * Valida la última fila usando `validate(row)`. Si pasa, agrega una fila
   * nueva y la marca como `openId`. Si falla, devuelve los errores y NO agrega.
   * El caller pasa `rows` para que el hook no necesite leer refs en render.
   */
  tryAddRow: (
    rows: BulkRow[],
    validate: (row: BulkRow) => RowValidation,
  ) => TryAddRowResult;
  /** @deprecated usar `tryAddRow` con validación; conservado por compatibilidad. */
  addRow: () => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, patch: Partial<BulkRow>) => void;
  updateRowField: <K extends keyof BulkRow>(
    id: string,
    key: K,
    value: BulkRow[K],
  ) => void;
  setRowResult: (id: string, result: BulkRowResult) => void;
  replaceRows: (next: BulkRow[]) => void;
  reset: () => void;
  clearCompletedRows: () => void;
  removeRowsByIds: (ids: ReadonlySet<string>) => void;
  totalHours: number;
  validRowCount: number;
  canAddRow: boolean;
  canRemoveRows: boolean;
  isAtLimit: boolean;
};

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildEmptyRow(
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  id: string,
  defaultActivity = "",
): BulkRow {
  return {
    id,
    pbiId: "",
    templateId: "",
    taskTitle: "",
    hours: "",
    description: "",
    activity: defaultActivity,
    workingDate: getDefaultWorkingDate(),
    workingTime: getDefaultWorkingTime(),
    taskState: defaultTaskState,
    markAsDone: !isTaskCreationMode,
    result: null,
    errors: {},
  };
}

function parseHours(raw: string): number {
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useBulkRows({
  isTaskCreationMode,
  defaultTaskState = "",
  defaultActivity = "",
  initialOpenId,
}: UseBulkRowsOptions): UseBulkRowsResult {
  // useId() devuelve un id estable entre SSR e hidratación. Si usáramos
  // crypto.randomUUID() en el inicializador del useState, server y client
  // generarían UUIDs distintos y los `id` / `htmlFor` derivados del id de
  // fila provocarían un mismatch de hidratación.
  const reactId = useId();

  // Pre-computamos la fila inicial y su id una sola vez por render del hook.
  // Esto evita leer refs durante render y mantiene `rows` y `openId`
  // sincronizados en el primer render.
  const [initialRow] = useState<BulkRow>(() =>
    buildEmptyRow(isTaskCreationMode, defaultTaskState, `bulk-row-${reactId}`, defaultActivity),
  );
  const [rows, setRows] = useState<BulkRow[]>(() => [initialRow]);
  const [openId, setOpenId] = useState<string | null>(
    () => initialOpenId ?? initialRow.id,
  );

  const replaceRows = useCallback((next: BulkRow[]) => {
    setRows(next);
    setOpenId((current) => {
      if (current && next.some((row) => row.id === current)) return current;
      return next[0]?.id ?? null;
    });
  }, []);

  const addRow = useCallback(() => {
    let freshId: string | null = null;
    setRows((current) => {
      if (current.length >= BULK_ROW_LIMIT) return current;
      // Se ejecuta tras click → ya estamos en cliente, random UUID está bien.
      const fresh = buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity);
      freshId = fresh.id;
      return [...current, fresh];
    });
    if (freshId !== null) setOpenId(freshId);
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const tryAddRow = useCallback<UseBulkRowsResult["tryAddRow"]>(
    (currentRows, validate) => {
      const previous = currentRows.at(-1);
      if (!previous) {
        const fresh = buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity);
        setRows([fresh]);
        setOpenId(fresh.id);
        return { added: true, newRowId: fresh.id };
      }

      const result = validate(previous);
      if (!result.ok) {
        setRows((current) =>
          current.map((row) =>
            row.id === previous.id ? { ...row, errors: result.errors } : row,
          ),
        );
        setOpenId(previous.id);
        return { added: false, errors: result.errors, blockedRowId: previous.id };
      }

      if (currentRows.length >= BULK_ROW_LIMIT) {
        return { added: false, errors: {}, blockedRowId: previous.id };
      }

      const fresh = buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity);
      setRows([...currentRows, fresh]);
      setOpenId(fresh.id);
      return { added: true, newRowId: fresh.id };
    },
    [defaultActivity, defaultTaskState, isTaskCreationMode],
  );

  const removeRow = useCallback((id: string) => {
    setRows((current) => {
      if (current.length <= 1) return current;
      return current.filter((row) => row.id !== id);
    });
    setOpenId((currentOpenId) => {
      if (currentOpenId !== id) return currentOpenId;
      const remaining = rows.find((row) => row.id !== id);
      return remaining?.id ?? null;
    });
  }, [rows]);

  const updateRow = useCallback((id: string, patch: Partial<BulkRow>) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        // Limpia automáticamente el error del campo cuando el caller lo
        // edita — replica el comportamiento de react-hook-form en el flujo
        // Individual (form.trigger al aplicar plantilla, setValue al tipear).
        const clearedErrors = { ...row.errors };
        for (const key of Object.keys(patch) as (keyof BulkRow)[]) {
          if (key === "id" || key === "errors" || key === "result") continue;
          if (key in clearedErrors) {
            clearedErrors[key] = undefined;
          }
        }
        return { ...row, ...patch, errors: clearedErrors };
      }),
    );
  }, []);

  const updateRowField = useCallback(
    <K extends keyof BulkRow>(id: string, key: K, value: BulkRow[K]) => {
      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                [key]: value,
                errors:
                  key === "result" || key === "errors"
                    ? row.errors
                    : { ...row.errors, [key]: undefined },
              }
            : row,
        ),
      );
    },
    [],
  );

  const setRowResult = useCallback((id: string, result: BulkRowResult) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, result } : row)),
    );
  }, []);

  const reset = useCallback(() => {
    const fresh = buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity);
    setRows([fresh]);
    setOpenId(fresh.id);
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const clearCompletedRows = useCallback(() => {
    setRows((current) => {
      const remaining = current.filter((row) => row.result?.ok !== true);
      return remaining.length > 0
        ? remaining
        : [buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity)];
    });
    setOpenId((currentOpenId) => {
      if (currentOpenId) {
        // Si la fila abierta no se borró, mantenla abierta.
        // Si se borró, abrimos la primera restante en el siguiente effect.
      }
      return currentOpenId;
    });
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const removeRowsByIds = useCallback(
    (ids: ReadonlySet<string>) => {
      setRows((current) => {
        const remaining = current.filter((row) => !ids.has(row.id));
        return remaining.length > 0
          ? remaining
          : [buildEmptyRow(isTaskCreationMode, defaultTaskState, newRowId(), defaultActivity)];
      });
    },
    [defaultActivity, defaultTaskState, isTaskCreationMode],
  );

  const { totalHours, validRowCount } = useMemo(() => {
    let hours = 0;
    let valid = 0;
    for (const row of rows) {
      const parsed = bulkRowSchema.safeParse({
        pbiId: row.pbiId,
        taskTitle: row.taskTitle,
        hours: row.hours,
        description: row.description,
        activity: row.activity,
        workingDate: row.workingDate,
        workingTime: row.workingTime,
        taskState: row.taskState,
        markAsDone: row.markAsDone,
      });
      if (parsed.success) {
        hours += parseBulkRowHours(parsed.data.hours);
        valid += 1;
      }
    }
    return { totalHours: hours, validRowCount: valid };
  }, [rows]);

  return {
    rows,
    openId,
    setOpenId,
    tryAddRow,
    addRow,
    removeRow,
    updateRow,
    updateRowField,
    setRowResult,
    replaceRows,
    reset,
    clearCompletedRows,
    removeRowsByIds,
    totalHours,
    validRowCount,
    canAddRow: rows.length < BULK_ROW_LIMIT,
    canRemoveRows: rows.length > 1,
    isAtLimit: rows.length >= BULK_ROW_LIMIT,
  };
}

/**
 * Helper para que el caller detecte si una fila concreta es válida (mismo
 * criterio que `validRowCount`) sin re-correr el schema en cada render.
 */
export function isBulkRowValid(row: BulkRow): boolean {
  return bulkRowSchema.safeParse({
    pbiId: row.pbiId,
    taskTitle: row.taskTitle,
    hours: row.hours,
    description: row.description,
    activity: row.activity,
    workingDate: row.workingDate,
    workingTime: row.workingTime,
    taskState: row.taskState,
    markAsDone: row.markAsDone,
  }).success;
}

export function parseBulkRowHours(raw: string): number {
  return parseHours(raw);
}

/**
 * Helper que mapea los issues de Zod a un `Record<field, message>` para
 * persistir en `BulkRow.errors`. Lo usa el bulk-form al construir el `validate`.
 */
export function mapBulkRowIssuesToErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_row");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
