import type { BulkRowFormValues } from "@/lib/schemas/time-log";

export type BulkRowResult = {
  ok: boolean;
  message: string | null;
  taskId?: number;
  markedAsDone?: boolean;
} | null;

export type BulkRow = {
  id: string;
  pbiId: string;
  templateId: string;
  taskTitle: string;
  hours: string;
  description: string;
  activity: string;
  workingDate: string;
  workingTime: string;
  /** Task state name — visible per-row only in task creation mode. */
  taskState: string;
  markAsDone: boolean;
  result: BulkRowResult;
  errors: Partial<Record<keyof BulkRowFormValues, string>>;
};

export const BULK_ROW_LIMIT = 10;
