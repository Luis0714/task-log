import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type SprintStatsScope = "team" | "goal";

export function filterWorkItemsToGoalScope(
  workItems: readonly AdoWorkItemOptionDto[],
  goalWorkItemIds: ReadonlySet<number>,
): AdoWorkItemOptionDto[] {
  if (goalWorkItemIds.size === 0) return [];
  return workItems.filter((workItem) => goalWorkItemIds.has(workItem.id));
}

export function filterBugsToGoalScope(
  bugs: readonly AdoWorkItemOptionDto[],
  goalWorkItemIds: ReadonlySet<number>,
): AdoWorkItemOptionDto[] {
  if (goalWorkItemIds.size === 0) return [];
  return bugs.filter((bug) => {
    const parentId = bug.parentId;
    return parentId != null && goalWorkItemIds.has(parentId);
  });
}

export function filterTasksToGoalScope(
  tasks: readonly AdoWorkItemOptionDto[],
  goalWorkItemIds: ReadonlySet<number>,
): AdoWorkItemOptionDto[] {
  if (goalWorkItemIds.size === 0) return [];
  return tasks.filter((task) => {
    const parentId = task.parentId;
    return parentId != null && goalWorkItemIds.has(parentId);
  });
}

export function resolveSprintStatsScope(goalOnly: boolean): SprintStatsScope {
  return goalOnly ? "goal" : "team";
}
