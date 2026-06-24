import type { BulkTaskFieldErrors, BulkTaskFormValues } from "@/lib/schemas/time-log";

export type BulkTaskResult = {
  ok: boolean;
  message: string | null;
  taskId?: number;
  markedAsDone?: boolean;
} | null;

/**
 * Una tarea individual dentro de una Historia de Usuario. NO incluye `pbiId`
 * porque ese dato vive en el `BulkGroup` padre. La forma coincide con
 * `BulkRow` menos `pbiId`.
 */
export type BulkTask = {
  id: string;
  templateId: string;
  taskTitle: string;
  hours: string;
  description: string;
  activity: string;
  workingDate: string;
  workingTime: string;
  /** Task state name — visible por tarea solo en task creation mode. */
  taskState: string;
  markAsDone: boolean;
  result: BulkTaskResult;
  errors: BulkTaskFieldErrors;
};

/**
 * Contenedor: una Historia de Usuario con una o más tareas hijas.
 * `pbiTitle` es opcional y se usa sólo para mostrar el resumen en el header
 * cuando el grupo está colapsado.
 */
export type BulkGroup = {
  id: string;
  pbiId: string;
  pbiTitle?: string;
  tasks: BulkTask[];
};

/**
 * Límite total de tareas en todas las historias combinadas. Coincide con el
 * límite que impone `agent.ts` en el wire schema (`tasks: array(1..10)`) y
 * con `BULK_ROW_LIMIT` original. Re-exportado desde `bulk-row.ts` para
 * mantener una única fuente de verdad.
 */
export const BULK_GROUP_LIMIT = 10;

export type { BulkTaskFormValues, BulkTaskFieldErrors };
