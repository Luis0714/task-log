import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraftDto } from "@/lib/schemas/sprint-story-goals";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { filterWorkItemsByClientCriteria } from "@/lib/azure-devops/work-items-filters";
import { parseGoalTagNames, serializeGoalTagNames } from "@/lib/sprints/goal-tags-serialization";

export type SprintStoryGoalBaseline = {
  stateName: string | null;
  tagNames: string[];
};

export type SprintStoryGoalDraft = {
  workItemId: number;
  includedInGoal: boolean;
  targetStateName: string;
  targetTagNames: string[];
};

export type SprintStoryGoalRowModel = {
  workItem: AdoWorkItemOptionDto;
  draft: SprintStoryGoalDraft;
  baseline: SprintStoryGoalBaseline | null;
};

export function createEmptySprintStoryGoalDraft(workItemId: number): SprintStoryGoalDraft {
  return {
    workItemId,
    includedInGoal: true,
    targetStateName: "",
    targetTagNames: [],
  };
}

export function sprintStoryGoalRecordToBaseline(
  record: SprintStoryGoalRecord,
): SprintStoryGoalBaseline | null {
  const stateName = record.baselineStateName?.trim() || null;
  const tagNames = parseGoalTagNames(record.baselineTacTagName);

  if (!stateName && tagNames.length === 0) return null;

  return { stateName, tagNames };
}

export function sprintStoryGoalDraftDtoToDraft(
  dto: SprintStoryGoalDraftDto,
): SprintStoryGoalDraft {
  return {
    workItemId: dto.workItemId,
    includedInGoal: dto.includedInGoal ?? true,
    targetStateName: dto.targetStateName ?? "",
    targetTagNames: parseGoalTagNames(dto.targetTacTagName),
  };
}

export function sprintStoryGoalRecordToDraft(
  record: SprintStoryGoalRecord,
): SprintStoryGoalDraft {
  return {
    workItemId: record.workItemId,
    includedInGoal: record.includedInGoal,
    targetStateName: record.targetStateName?.trim() ?? "",
    targetTagNames: parseGoalTagNames(record.targetTacTagName),
  };
}

export function isSprintStoryGoalDraftEmpty(
  draft: Pick<SprintStoryGoalDraft, "targetStateName" | "targetTagNames">,
): boolean {
  return !draft.targetStateName.trim() && draft.targetTagNames.length === 0;
}

export function isSprintStoryGoalDraftValid(
  draft: Pick<SprintStoryGoalDraft, "includedInGoal" | "targetStateName" | "targetTagNames">,
): boolean {
  if (!draft.includedInGoal) return true;
  if (isSprintStoryGoalDraftEmpty(draft)) return true;
  return Boolean(draft.targetStateName.trim() || draft.targetTagNames.length > 0);
}

export function sprintStoryGoalDraftValidationMessage(
  draft: Pick<SprintStoryGoalDraft, "includedInGoal" | "targetStateName" | "targetTagNames">,
): string | null {
  if (isSprintStoryGoalDraftValid(draft)) return null;
  return "Indica al menos un estado objetivo o un tag objetivo.";
}

export function areSprintStoryGoalDraftsEqual(
  left: SprintStoryGoalDraft,
  right: SprintStoryGoalDraft,
): boolean {
  return (
    left.workItemId === right.workItemId &&
    left.includedInGoal === right.includedInGoal &&
    left.targetStateName.trim() === right.targetStateName.trim() &&
    left.targetTagNames.length === right.targetTagNames.length &&
    left.targetTagNames.every((tag, index) => tag === right.targetTagNames[index])
  );
}

/** Punto de partida guardado o, si aún no se guardó, estado/tag actuales de ADO. */
export function resolveSprintStoryGoalRowBaseline(
  row: Pick<SprintStoryGoalRowModel, "workItem" | "baseline">,
): SprintStoryGoalBaseline {
  if (row.baseline) return row.baseline;

  return {
    stateName: row.workItem.state?.trim() || null,
    tagNames: (row.workItem.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
  };
}

export function resolveSprintStoryGoalRowCurrentTags(workItem: AdoWorkItemOptionDto): string[] {
  return (workItem.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
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
  if (!draft.includedInGoal) {
    return {
      workItemId: draft.workItemId,
      includedInGoal: false,
      targetStateName: "",
      targetTacTagName: "",
    };
  }

  if (!isSprintStoryGoalDraftValid(draft)) return null;
  if (isSprintStoryGoalDraftEmpty(draft)) return null;

  return {
    workItemId: draft.workItemId,
    includedInGoal: true,
    targetStateName: draft.targetStateName.trim(),
    targetTacTagName: serializeGoalTagNames(draft.targetTagNames),
  };
}

export function countSprintStoryGoals(
  drafts: readonly SprintStoryGoalDraft[],
): number {
  return drafts.filter(
    (draft) => draft.includedInGoal && !isSprintStoryGoalDraftEmpty(draft),
  ).length;
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
