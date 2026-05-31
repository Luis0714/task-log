import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  BUG_STATUS_MAPPING,
  stateMatchesCompletedState,
} from "@/lib/dashboard/sprint-status-mapping";
import type { SprintBugDetailItem } from "@/lib/sprints/sprint-stats-types";

const UNASSIGNED_LABEL = "Sin asignar";

export function isSprintBugAttended(state: string | undefined | null): boolean {
  if (!state?.trim()) return false;
  return stateMatchesCompletedState(state, BUG_STATUS_MAPPING);
}

export function buildParentTitleLookup(
  workItems: readonly AdoWorkItemOptionDto[],
): Map<number, string> {
  return new Map(workItems.map((workItem) => [workItem.id, workItem.title]));
}

function compareBugDetailItems(left: SprintBugDetailItem, right: SprintBugDetailItem): number {
  if (left.isAttended !== right.isAttended) {
    return left.isAttended ? 1 : -1;
  }

  const leftAssignee = left.assignedTo ?? UNASSIGNED_LABEL;
  const rightAssignee = right.assignedTo ?? UNASSIGNED_LABEL;
  if (leftAssignee !== rightAssignee) {
    if (leftAssignee === UNASSIGNED_LABEL) return 1;
    if (rightAssignee === UNASSIGNED_LABEL) return -1;
    return leftAssignee.localeCompare(rightAssignee, "es");
  }

  return left.title.localeCompare(right.title, "es");
}

export type BuildSprintBugDetailItemsInput = {
  bugs: readonly AdoWorkItemOptionDto[];
  goalWorkItemIds: ReadonlySet<number>;
  parentTitlesById?: ReadonlyMap<number, string>;
};

export function buildSprintBugDetailItems(
  input: BuildSprintBugDetailItemsInput,
): SprintBugDetailItem[] {
  const { bugs, goalWorkItemIds, parentTitlesById } = input;

  return bugs
    .map((bug): SprintBugDetailItem => {
      const parentId = bug.parentId ?? null;
      const inGoalScope = parentId != null && goalWorkItemIds.has(parentId);

      return {
        workItemId: bug.id,
        title: bug.title,
        assignedTo: bug.assignedTo?.trim() || null,
        state: bug.state?.trim() || "Sin estado",
        isAttended: isSprintBugAttended(bug.state),
        parentId,
        parentTitle: parentId ? parentTitlesById?.get(parentId) ?? null : null,
        inGoalScope,
      };
    })
    .sort(compareBugDetailItems);
}
