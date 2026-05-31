import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  SprintGoalRecord,
  SprintGoalRepository,
} from "@/lib/db/ports/sprint-goal.repository.port";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { sprintGoals } from "@/lib/db/schema";

function scopeConditions(scope: SprintGoalScope) {
  return and(
    eq(sprintGoals.organization, scope.organization),
    eq(sprintGoals.project, scope.project),
    eq(sprintGoals.team, scope.team),
    eq(sprintGoals.sprintPath, scope.sprintPath),
  );
}

export const drizzleSprintGoalRepository: SprintGoalRepository = {
  async getByScope(scope) {
    const rows = await getDb()
      .select({ generalObjective: sprintGoals.generalObjective })
      .from(sprintGoals)
      .where(scopeConditions(scope))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      generalObjective: row.generalObjective,
    } satisfies SprintGoalRecord;
  },

  async upsertGeneralObjective(scope, generalObjective) {
    const trimmed = generalObjective?.trim() ?? "";

    if (!trimmed) {
      await getDb().delete(sprintGoals).where(scopeConditions(scope));
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
