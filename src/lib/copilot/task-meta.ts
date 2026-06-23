/**
 * Tipos y constantes compartidas entre el route `/api/copilot/task-meta` y el
 * hook cliente `useTaskMeta`. Este archivo NO debe importar nada de `next/headers`,
 * `server-only`, ni de servicios de servidor — se consume desde Client Components.
 */
import { TASK_ACTIVITY_VALUES } from "@/lib/schemas/agent";

/** Estados que se muestran en los `<Select>` del Copiloto si Azure no responde. */
export const FALLBACK_TASK_STATE_NAMES = [
  "Proposed",
  "Active",
  "Resolved",
  "Closed",
] as const;

export type TaskMetaResponse = {
  activities: readonly string[];
  stateNames: readonly string[];
};

export const FALLBACK_TASK_META: TaskMetaResponse = {
  activities: TASK_ACTIVITY_VALUES,
  stateNames: FALLBACK_TASK_STATE_NAMES,
};
