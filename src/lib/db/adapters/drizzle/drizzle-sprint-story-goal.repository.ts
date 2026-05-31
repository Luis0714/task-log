import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  SprintGoalScope,
  SprintStoryGoalRecord,
  SprintStoryGoalRepository,
} from "@/lib/db/ports/sprint-story-goal.repository.port";
import { sprintStoryGoals } from "@/lib/db/schema";

function scopeConditions(scope: SprintGoalScope) {
  return and(
    eq(sprintStoryGoals.organization, scope.organization),
    eq(sprintStoryGoals.project, scope.project),
    eq(sprintStoryGoals.team, scope.team),
    eq(sprintStoryGoals.sprintPath, scope.sprintPath),
  );
}

function mapRow(row: typeof sprintStoryGoals.$inferSelect): SprintStoryGoalRecord {
  return {
    workItemId: row.workItemId,
    targetStateName: row.targetStateName,
    targetTacTagName: row.targetTacTagName,
    baselineStateName: row.baselineStateName,
    baselineTacTagName: row.baselineTacTagName,
    observation: row.observation,
  };
}

export const drizzleSprintStoryGoalRepository: SprintStoryGoalRepository = {
  async listByScope(scope) {
    const rows = await getDb()
      .select()
      .from(sprintStoryGoals)
      .where(scopeConditions(scope));

    return rows.map(mapRow);
  },

  async replaceScopeGoals(scope, goals) {
    await getDb().transaction(async (tx) => {
      await tx.delete(sprintStoryGoals).where(scopeConditions(scope));

      if (goals.length === 0) return;

      await tx.insert(sprintStoryGoals).values(
        goals.map((goal) => ({
          organization: scope.organization,
          project: scope.project,
          team: scope.team,
          sprintPath: scope.sprintPath,
          workItemId: goal.workItemId,
          targetStateName: goal.targetStateName,
          targetTacTagName: goal.targetTacTagName,
          baselineStateName: goal.baselineStateName,
          baselineTacTagName: goal.baselineTacTagName,
          observation: goal.observation,
        })),
      );
    });
  },
};
