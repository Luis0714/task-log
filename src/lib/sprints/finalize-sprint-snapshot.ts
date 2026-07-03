import "server-only";

import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintNonWorkingDates,
  loadSprintPeriodBugs,
  loadSprintPeriodTasks,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { fetchWorkItemsByIds } from "@/lib/azure-devops/work-items";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { buildSprintStorySnapshot } from "@/lib/sprints/build-sprint-story-snapshot";
import { collectGoalWorkItemIds } from "@/lib/sprints/build-bug-quality-metrics";
import { buildSprintStatsPayloadBundle } from "@/lib/sprints/build-sprint-operational-metrics";
import {
  mapGoalsByWorkItemId,
  mergeSprintFinalizeWorkItems,
  resolveOrphanGoalWorkItemIds,
} from "@/lib/sprints/merge-sprint-finalize-work-items";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { SPRINT_ALREADY_FINALIZED_MESSAGE } from "@/lib/sprints/sprint-finalized-messages";
import type {
  SaveSprintSnapshotInput,
  SprintSnapshotData,
  SprintSnapshotSource,
} from "@/lib/sprints/sprint-snapshot-types";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type FinalizeSprintSnapshotInput = {
  scope: SprintGoalScope;
  auth: AdoCallerAuth;
  source?: SprintSnapshotSource;
  finalizedByUserId?: string | null;
  finalizedByDisplayName?: string | null;
  sprintName?: string | null;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
};

export type FinalizeSprintSnapshotResult =
  | { ok: true; snapshot: SprintSnapshotData }
  | { ok: false; message: string };

export async function finalizeSprintSnapshot(
  input: FinalizeSprintSnapshotInput,
): Promise<FinalizeSprintSnapshotResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "No se pudo guardar la retrospectiva del sprint.",
    };
  }

  if (await isSprintScopeFinalized(input.scope)) {
    return { ok: false, message: SPRINT_ALREADY_FINALIZED_MESSAGE };
  }

  const scopedAuth = withAdoProject(input.auth, input.scope.project);
  const [workItemsPart, bugsPart, tasksPart, backlogStatesPart, tagsPart, nonWorkingDatesPart, assigneeRoster, goals, sprintGoal] =
    await Promise.all([
      loadSprintWorkItems(input.scope.project, input.scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadSprintPeriodBugs(
        input.scope.project,
        input.scope.team,
        input.scope.sprintPath,
        input.sprintStartDate ?? null,
        input.sprintFinishDate ?? null,
        WORK_ITEM_ASSIGNEE_ALL,
      ),
      loadSprintPeriodTasks(
        input.scope.project,
        input.scope.team,
        input.scope.sprintPath,
        input.sprintStartDate ?? null,
        input.sprintFinishDate ?? null,
        WORK_ITEM_ASSIGNEE_ALL,
      ),
      loadSprintBacklogStates(input.scope.project),
      loadProjectWorkItemTags(input.scope.project),
      loadSprintNonWorkingDates(input.scope.project, input.scope.team),
      loadTeamMembers({
        project: input.scope.project,
        team: input.scope.team,
        sprintPath: input.scope.sprintPath,
        source: "workItems",
      }),
      getRepositories().sprintStoryGoal.listByScope(input.scope),
      getRepositories().sprintGoal.getByScope(input.scope),
    ]);

  const adoError = firstSprintDataError(
    workItemsPart,
    bugsPart,
    tasksPart,
    backlogStatesPart,
    nonWorkingDatesPart,
  );
  if (adoError) {
    return { ok: false, message: adoError };
  }

  if (tagsPart.error) {
    return { ok: false, message: tagsPart.error };
  }

  const orphanIds = resolveOrphanGoalWorkItemIds(workItemsPart.data, goals);
  const orphanWorkItems =
    orphanIds.length > 0 ? await fetchWorkItemsByIds(scopedAuth, orphanIds) : [];

  const workItems = mergeSprintFinalizeWorkItems(workItemsPart.data, orphanWorkItems);
  const goalsByWorkItemId = mapGoalsByWorkItemId(goals);
  const backlogStateOrder = backlogStatesPart.data.map((state) => state.name);

  const stories = workItems.map((workItem) =>
    buildSprintStorySnapshot({
      workItem,
      goal: goalsByWorkItemId.get(workItem.id),
      catalogTags: tagsPart.tags,
      backlogStateOrder,
    }),
  );

  const statsPayload = buildSprintStatsPayloadBundle({
    workItems,
    bugs: bugsPart.data,
    tasks: tasksPart.data,
    backlogStates: backlogStatesPart.data,
    goalWorkItemIds: collectGoalWorkItemIds(stories),
    sprintStartDate: input.sprintStartDate,
    sprintFinishDate: input.sprintFinishDate,
    nonWorkingDates: nonWorkingDatesPart.data,
    assigneeRoster,
  });

  const saveInput: SaveSprintSnapshotInput = {
    source: input.source ?? "manual",
    finalizedByUserId: input.finalizedByUserId ?? null,
    finalizedByDisplayName: input.finalizedByDisplayName ?? null,
    generalObjective: sprintGoal?.generalObjective ?? null,
    sprintName: input.sprintName ?? null,
    sprintStartDate: input.sprintStartDate ?? null,
    sprintFinishDate: input.sprintFinishDate ?? null,
    stories,
    statsPayload,
  };

  const snapshot = await getRepositories().sprintSnapshot.save(input.scope, saveInput);
  return { ok: true, snapshot };
}
