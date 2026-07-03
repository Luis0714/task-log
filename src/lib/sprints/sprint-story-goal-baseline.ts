import type { AdoWorkItemOptionDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { serializeGoalTagNames } from "@/lib/sprints/goal-tags-serialization";
import { normalizeWorkItemTag } from "@/lib/work-items/ado-work-item-tags";

export function resolveBaselineTacTagName(
  tags: readonly string[] | undefined,
  catalogTags: readonly AdoWorkItemTagDto[],
): string | null {
  const safeTags = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (safeTags.length === 0) return null;

  const catalogNames = new Set(
    catalogTags.map((tag) => normalizeWorkItemTag(tag.name)).filter(Boolean),
  );

  const catalogMatch = safeTags.find((tag) =>
    catalogNames.has(normalizeWorkItemTag(tag)),
  );
  return catalogMatch ?? null;
}

export function resolveSprintStoryGoalBaseline(
  workItem: AdoWorkItemOptionDto | undefined,
  _catalogTags: readonly AdoWorkItemTagDto[],
  existingGoal: SprintStoryGoalRecord | undefined,
): { baselineStateName: string | null; baselineTacTagName: string | null } {
  if (existingGoal?.baselineStateName || existingGoal?.baselineTacTagName) {
    return {
      baselineStateName: existingGoal.baselineStateName,
      baselineTacTagName: existingGoal.baselineTacTagName,
    };
  }

  const initialTags = (workItem?.tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  return {
    baselineStateName: workItem?.state?.trim() || null,
    baselineTacTagName: serializeGoalTagNames(initialTags) || null,
  };
}
