import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  SprintGoalRecord,
  SprintGoalRepository,
} from "@/lib/db/ports/sprint-goal.repository.port";
import { sprintGoals } from "@/lib/db/schema";
import {
  ensureSprintGoalIdByScope,
  sprintGoalScopeConditions,
} from "@/lib/db/adapters/drizzle/drizzle-sprint-goal-scope";

export const drizzleSprintGoalRepository: SprintGoalRepository = {
  async getByScope(scope) {
    const rows = await getDb()
      .select({ generalObjective: sprintGoals.generalObjective })
      .from(sprintGoals)
      .where(sprintGoalScopeConditions(scope))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      generalObjective: row.generalObjective,
    } satisfies SprintGoalRecord;
  },

  ensureByScope: ensureSprintGoalIdByScope,

  async upsertGeneralObjective(scope, generalObjective) {
    const trimmed = generalObjective?.trim() ?? "";

    if (!trimmed) {
      const existing = await getDb()
        .select({ id: sprintGoals.id })
        .from(sprintGoals)
        .where(sprintGoalScopeConditions(scope))
        .limit(1);

      if (!existing[0]) return;

      await getDb()
        .update(sprintGoals)
        .set({ generalObjective: null, updatedAt: new Date() })
        .where(eq(sprintGoals.id, existing[0].id));
      return;
    }

    await getDb()
      .insert(sprintGoals)
      .values({
        organization: scope.organization,
        project: scope.project,
        team: scope.team,
        sprintPath: scope.sprintPath,
        generalObjective: trimmed,
      })
      .onConflictDoUpdate({
        target: [
          sprintGoals.organization,
          sprintGoals.project,
          sprintGoals.team,
          sprintGoals.sprintPath,
        ],
        set: {
          generalObjective: trimmed,
          updatedAt: new Date(),
        },
      });
  },
};
