import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  SprintGoalScope,
  SprintStoryGoalRepository,
} from "@/lib/db/ports/sprint-story-goal.repository.port";
import {
  ensureSprintGoalIdByScope,
  sprintGoalScopeConditions,
} from "@/lib/db/adapters/drizzle/drizzle-sprint-goal-scope";
import { sprintGoals, sprintStoryGoals } from "@/lib/db/schema";

export const drizzleSprintStoryGoalRepository: SprintStoryGoalRepository = {
  async listByScope(scope) {
    const rows = await getDb()
      .select({
        workItemId: sprintStoryGoals.workItemId,
        targetStateName: sprintStoryGoals.targetStateName,
        targetTacTagName: sprintStoryGoals.targetTacTagName,
        baselineStateName: sprintStoryGoals.baselineStateName,
        baselineTacTagName: sprintStoryGoals.baselineTacTagName,
        includedInGoal: sprintStoryGoals.includedInGoal,
        observation: sprintStoryGoals.observation,
      })
      .from(sprintStoryGoals)
      .innerJoin(sprintGoals, eq(sprintStoryGoals.sprintGoalId, sprintGoals.id))
      .where(sprintGoalScopeConditions(scope));

    return rows.map((row) => ({
      workItemId: row.workItemId,
      targetStateName: row.targetStateName,
      targetTacTagName: row.targetTacTagName,
      baselineStateName: row.baselineStateName,
      baselineTacTagName: row.baselineTacTagName,
      includedInGoal: row.includedInGoal,
      observation: row.observation,
    }));
  },

  async replaceScopeGoals(scope, goals) {
    const sprintGoalId = await ensureSprintGoalIdByScope(scope);

    await getDb().transaction(async (tx) => {
      await tx
        .delete(sprintStoryGoals)
        .where(eq(sprintStoryGoals.sprintGoalId, sprintGoalId));

      if (goals.length === 0) return;

      await tx.insert(sprintStoryGoals).values(
        goals.map((goal) => ({
          sprintGoalId,
          workItemId: goal.workItemId,
          targetStateName: goal.targetStateName,
          targetTacTagName: goal.targetTacTagName,
          baselineStateName: goal.baselineStateName,
          baselineTacTagName: goal.baselineTacTagName,
          includedInGoal: goal.includedInGoal,
          observation: goal.observation,
        })),
      );
    });
  },
};
