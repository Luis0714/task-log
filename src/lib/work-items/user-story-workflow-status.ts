import {
  stateMatchesCategory,
  stateMatchesCompletedState,
  USER_STORY_STATUS_MAPPING,
} from "@/lib/dashboard/sprint-status-mapping";

function isCommittedPbiState(state: string): boolean {
  return stateMatchesCategory(state, USER_STORY_STATUS_MAPPING.inProgress);
}

function isDevelopedPbiState(state: string): boolean {
  return stateMatchesCompletedState(state, USER_STORY_STATUS_MAPPING);
}
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

function isPendingState(state: string): boolean {
  return (
    isCommittedPbiState(state) ||
    stateMatchesCategory(state, USER_STORY_STATUS_MAPPING.pending)
  );
}

function hasWorkflowTag(item: UserStoryWorkflowItem, label: string): boolean {
  return workItemHasTag(itemTags(item), label);
}

export function isDevelopedUserStory(item: UserStoryWorkflowItem): boolean {
  if (isDevelopedPbiState(item.state)) return true;

  return (
    isCommittedPbiState(item.state) &&
    hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)
  );
}

export function isInProgressUserStory(item: UserStoryWorkflowItem): boolean {
  return (
    isCommittedPbiState(item.state) &&
    hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO) &&
    !hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)
  );
}

export function isPendingUserStory(item: UserStoryWorkflowItem): boolean {
  if (!isPendingState(item.state)) return false;

  return (
    !hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO) &&
    !hasWorkflowTag(item, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)
  );
}

export function classifyUserStoryWorkflow(
  item: UserStoryWorkflowItem,
): UserStoryWorkflowCategory {
  if (isDevelopedUserStory(item)) return "developed";
  if (isInProgressUserStory(item)) return "inProgress";
  if (isPendingUserStory(item)) return "pending";
  return "other";
}

export function filterUserStoriesByWorkflowCategory<T extends UserStoryWorkflowItem>(
  items: readonly T[],
  category: UserStoryWorkflowCategory,
): T[] {
  return items.filter((item) => classifyUserStoryWorkflow(item) === category);
}
