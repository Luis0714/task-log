import {
  stateMatchesCategory,
  stateMatchesCompletedState,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import { workItemHasTag } from "@/lib/work-items/ado-work-item-tags";
import { HU_WORKFLOW_TAG_LABELS } from "@/lib/work-items/user-story-workflow-tags";

export type UserStoryWorkflowCategory = "pending" | "inProgress" | "developed" | "other";

export type UserStoryWorkflowItem = {
  state: string;
  tags?: readonly string[];
};

function itemTags(item: UserStoryWorkflowItem): readonly string[] {
  return item.tags ?? [];
}

/**
 * El mapeo es dinámico — debe venir del catálogo ADO cargado por el caller
 * (ver `buildSprintStatusMapping`). Estos helpers privados lo reciben siempre.
 */
function isCommittedPbiState(state: string, mapping: SprintStatusMapping): boolean {
  return stateMatchesCategory(state, mapping.inProgress);
}

function isDevelopedPbiState(state: string, mapping: SprintStatusMapping): boolean {
  return stateMatchesCompletedState(state, mapping);
}

function isPendingState(state: string, mapping: SprintStatusMapping): boolean {
  return (
    isCommittedPbiState(state, mapping) ||
    stateMatchesCategory(state, mapping.pending)
  );
}

function hasWorkflowTag(item: UserStoryWorkflowItem, label: string): boolean {
  return workItemHasTag(itemTags(item), label);
}

/**
 * Clasifica una HU. El `mapping` se construye en el loader con
 * `buildSprintStatusMapping(states)` a partir del catálogo de Azure.
 */
export function classifyUserStoryWorkflow(
  item: UserStoryWorkflowItem,
  mapping: SprintStatusMapping,
): UserStoryWorkflowCategory {
  const committed = isCommittedPbiState(item.state, mapping);
  const developed = isDevelopedPbiState(item.state, mapping);
  const pending = isPendingState(item.state, mapping);

  if (developed) return "developed";

  if (committed && hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO)) {
    return hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)
      ? "developed"
      : "inProgress";
  }

  if (committed && hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)) {
    return "developed";
  }

  if (pending) {
    const enDesarrollo = hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO);
    const desarrollada = hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA);
    if (!enDesarrollo && !desarrollada) return "pending";
  }

  return "other";
}

export function filterUserStoriesByWorkflowCategory<T extends UserStoryWorkflowItem>(
  items: readonly T[],
  category: UserStoryWorkflowCategory,
  mapping: SprintStatusMapping,
): T[] {
  return items.filter((item) => classifyUserStoryWorkflow(item, mapping) === category);
}