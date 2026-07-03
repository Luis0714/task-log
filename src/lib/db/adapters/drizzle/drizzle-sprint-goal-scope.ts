import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { sprintGoals } from "@/lib/db/schema";

export function sprintGoalScopeConditions(scope: SprintGoalScope) {
  return and(
    eq(sprintGoals.organization, scope.organization),
    eq(sprintGoals.project, scope.project),
    eq(sprintGoals.team, scope.team),
    eq(sprintGoals.sprintPath, scope.sprintPath),
  );
}

export async function ensureSprintGoalIdByScope(scope: SprintGoalScope): Promise<string> {
  const existing = await getDb()
    .select({ id: sprintGoals.id })
    .from(sprintGoals)
    .where(sprintGoalScopeConditions(scope))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const inserted = await getDb()
    .insert(sprintGoals)
    .values({
      organization: scope.organization,
      project: scope.project,
      team: scope.team,
      sprintPath: scope.sprintPath,
      generalObjective: null,
    })
    .returning({ id: sprintGoals.id });

  return inserted[0]!.id;
}
