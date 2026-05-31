import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";

export function mergeSprintFinalizeWorkItems(
  sprintWorkItems: readonly AdoWorkItemOptionDto[],
  orphanWorkItems: readonly AdoWorkItemOptionDto[],
): AdoWorkItemOptionDto[] {
  const byId = new Map<number, AdoWorkItemOptionDto>();

  for (const workItem of sprintWorkItems) {
    byId.set(workItem.id, workItem);
  }

  for (const workItem of orphanWorkItems) {
    if (!byId.has(workItem.id)) {
      byId.set(workItem.id, workItem);
    }
  }

  return [...byId.values()].sort((left, right) => left.title.localeCompare(right.title, "es"));
}

export function resolveOrphanGoalWorkItemIds(
  sprintWorkItems: readonly AdoWorkItemOptionDto[],
  goals: readonly SprintStoryGoalRecord[],
): number[] {
  const sprintIds = new Set(sprintWorkItems.map((item) => item.id));
  return goals
    .map((goal) => goal.workItemId)
    .filter((workItemId) => !sprintIds.has(workItemId));
}

export function mapGoalsByWorkItemId(
  goals: readonly SprintStoryGoalRecord[],
): Map<number, SprintStoryGoalRecord> {
  return new Map(goals.map((goal) => [goal.workItemId, goal]));
}
