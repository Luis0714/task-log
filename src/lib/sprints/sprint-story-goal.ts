import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraftDto } from "@/lib/schemas/sprint-story-goals";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { filterWorkItemsByClientCriteria } from "@/lib/azure-devops/work-items-filters";

export type SprintStoryGoalBaseline = {
  stateName: string | null;
  tacTagName: string | null;
};

export type SprintStoryGoalDraft = {
  workItemId: number;
  targetStateName: string;
  targetTacTagName: string;
};

export type SprintStoryGoalRowModel = {
  workItem: AdoWorkItemOptionDto;
  draft: SprintStoryGoalDraft;
  baseline: SprintStoryGoalBaseline | null;
};

export function createEmptySprintStoryGoalDraft(workItemId: number): SprintStoryGoalDraft {
  return {
    workItemId,
    targetStateName: "",
    targetTacTagName: "",
  };
}

export function sprintStoryGoalRecordToBaseline(
  record: SprintStoryGoalRecord,
): SprintStoryGoalBaseline | null {
  const stateName = record.baselineStateName?.trim() || null;
  const tacTagName = record.baselineTacTagName?.trim() || null;

  if (!stateName && !tacTagName) return null;

  return { stateName, tacTagName };
}

export function sprintStoryGoalRecordToDraft(
  record: SprintStoryGoalRecord,
): SprintStoryGoalDraft {
  return {
    workItemId: record.workItemId,
    targetStateName: record.targetStateName?.trim() ?? "",
    targetTacTagName: record.targetTacTagName?.trim() ?? "",
  };
}

export function isSprintStoryGoalDraftEmpty(
  draft: Pick<SprintStoryGoalDraft, "targetStateName" | "targetTacTagName">,
): boolean {
  return !draft.targetStateName.trim() && !draft.targetTacTagName.trim();
}

export function isSprintStoryGoalDraftValid(
  draft: Pick<SprintStoryGoalDraft, "targetStateName" | "targetTacTagName">,
): boolean {
  if (isSprintStoryGoalDraftEmpty(draft)) return true;
  return Boolean(draft.targetStateName.trim() || draft.targetTacTagName.trim());
}

export function sprintStoryGoalDraftValidationMessage(
  draft: Pick<SprintStoryGoalDraft, "targetStateName" | "targetTacTagName">,
): string | null {
  if (isSprintStoryGoalDraftValid(draft)) return null;
  return "Indica al menos un estado objetivo o un TAC objetivo.";
}

export function areSprintStoryGoalDraftsEqual(
  left: SprintStoryGoalDraft,
  right: SprintStoryGoalDraft,
): boolean {
  return (
    left.workItemId === right.workItemId &&
    left.targetStateName.trim() === right.targetStateName.trim() &&
    left.targetTacTagName.trim() === right.targetTacTagName.trim()
  );
}

export function buildSprintStoryGoalRows(
  workItems: readonly AdoWorkItemOptionDto[],
  goals: readonly SprintStoryGoalRecord[],
): SprintStoryGoalRowModel[] {
  const goalByWorkItemId = new Map(goals.map((goal) => [goal.workItemId, goal]));

  return workItems.map((workItem) => {
    const savedGoal = goalByWorkItemId.get(workItem.id);
    return {
      workItem,
      draft: savedGoal
        ? sprintStoryGoalRecordToDraft(savedGoal)
        : createEmptySprintStoryGoalDraft(workItem.id),
      baseline: savedGoal ? sprintStoryGoalRecordToBaseline(savedGoal) : null,
    };
  });
}

export function normalizeSprintStoryGoalDraftForSave(
  draft: SprintStoryGoalDraft,
): SprintStoryGoalDraftDto | null {
  if (!isSprintStoryGoalDraftValid(draft)) return null;
  if (isSprintStoryGoalDraftEmpty(draft)) return null;

  return {
    workItemId: draft.workItemId,
    targetStateName: draft.targetStateName.trim(),
    targetTacTagName: draft.targetTacTagName.trim(),
  };
}

export function countSprintStoryGoals(
  drafts: readonly SprintStoryGoalDraft[],
): number {
  return drafts.filter((draft) => !isSprintStoryGoalDraftEmpty(draft)).length;
}

export function filterSprintStoryGoalRows(
  rows: readonly SprintStoryGoalRowModel[],
  search: string,
): SprintStoryGoalRowModel[] {
  const trimmedSearch = search.trim();
  if (!trimmedSearch) return [...rows];

  const matchingIds = new Set(
    filterWorkItemsByClientCriteria(
      rows.map((row) => row.workItem),
      { search: trimmedSearch, states: [] },
    ).map((item) => item.id),
  );

  return rows.filter((row) => matchingIds.has(row.workItem.id));
}
