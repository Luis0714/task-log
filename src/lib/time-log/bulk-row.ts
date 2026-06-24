export {
  BULK_GROUP_LIMIT,
  type BulkGroup,
  type BulkTask,
  type BulkTaskResult,
} from "@/lib/time-log/bulk-group";

/**
 * @deprecated Usa `BULK_GROUP_LIMIT` desde `@/lib/time-log/bulk-group`.
 * Conservado para que cualquier import residual siga funcionando durante la
 * transición; eliminar una vez migrados los call sites.
 */
export const BULK_ROW_LIMIT = 10;
