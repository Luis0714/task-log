import "server-only";

import { loadSprintWorkItems } from "@/lib/ado/load-sprint-data";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type {
  SprintGoalScope,
  SprintStoryGoalRecord,
  SprintStoryGoalUpsertInput,
} from "@/lib/db/ports/sprint-story-goal.repository.port";
import type { AdoWorkItemOptionDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraftDto } from "@/lib/schemas/sprint-story-goals";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { resolveSprintStoryGoalBaseline } from "@/lib/sprints/sprint-story-goal-baseline";
import { serializeGoalTagNames } from "@/lib/sprints/goal-tags-serialization";
import {
  isSprintStoryGoalDraftEmpty,
  isSprintStoryGoalDraftValid,
  sprintStoryGoalDraftDtoToDraft,
} from "@/lib/sprints/sprint-story-goal";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { SPRINT_FINALIZED_READ_ONLY_MESSAGE } from "@/lib/sprints/sprint-finalized-messages";

export type SaveSprintStoryGoalsResult =
  | { ok: true }
  | { ok: false; message: string };

function toUpsertInput(
  draftDto: SprintStoryGoalDraftDto,
  existingGoal: SprintStoryGoalRecord | undefined,
  workItem: AdoWorkItemOptionDto | undefined,
  catalogTags: readonly AdoWorkItemTagDto[],
): SprintStoryGoalUpsertInput | null {
  const draft = sprintStoryGoalDraftDtoToDraft(draftDto);

  if (draft.includedInGoal === false) {
    return {
      workItemId: draftDto.workItemId,
      targetStateName: null,
      targetTacTagName: null,
      baselineStateName: null,
      baselineTacTagName: null,
      includedInGoal: false,
      observation: null,
    };
  }

  if (isSprintStoryGoalDraftEmpty(draft)) return null;
  if (!isSprintStoryGoalDraftValid(draft)) return null;

  const baseline = resolveSprintStoryGoalBaseline(workItem, catalogTags, existingGoal);

  return {
    workItemId: draft.workItemId,
    targetStateName: draft.targetStateName.trim() || null,
    targetTacTagName: serializeGoalTagNames(draft.targetTagNames) || null,
    baselineStateName: baseline.baselineStateName,
    baselineTacTagName: baseline.baselineTacTagName,
    includedInGoal: true,
    observation: null,
  };
}

export async function saveSprintStoryGoals(
  scope: SprintGoalScope,
  drafts: readonly SprintStoryGoalDraftDto[],
  generalObjective = "",
): Promise<SaveSprintStoryGoalsResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "No se pudieron guardar los objetivos del sprint.",
    };
  }

  if (await isSprintScopeFinalized(scope)) {
    return { ok: false, message: SPRINT_FINALIZED_READ_ONLY_MESSAGE };
  }

  for (const draftDto of drafts) {
    const draft = sprintStoryGoalDraftDtoToDraft(draftDto);
    if (draft.includedInGoal === false) continue;
    if (!isSprintStoryGoalDraftValid(draft)) {
      return {
        ok: false,
        message: `La historia #${draft.workItemId} necesita al menos un estado o tag objetivo.`,
      };
    }
  }

  try {
    const [existingGoals, workItemsPart, tagsPart] = await Promise.all([
      getRepositories().sprintStoryGoal.listByScope(scope),
      loadSprintWorkItems(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadProjectWorkItemTags(scope.project),
    ]);

    const existingByWorkItemId = new Map(
      existingGoals.map((goal) => [goal.workItemId, goal]),
    );
    const workItemById = new Map(workItemsPart.data.map((item) => [item.id, item]));

    const goals = drafts
      .map((draft) =>
        toUpsertInput(
          draft,
          existingByWorkItemId.get(draft.workItemId),
          workItemById.get(draft.workItemId),
          tagsPart.tags,
        ),
      )
      .filter((goal): goal is SprintStoryGoalUpsertInput => goal !== null);

    await Promise.all([
      getRepositories().sprintStoryGoal.replaceScopeGoals(scope, goals),
      getRepositories().sprintGoal.upsertGeneralObjective(
        scope,
        generalObjective.trim() || null,
      ),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudieron guardar los objetivos del sprint." };
  }
}
