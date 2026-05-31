import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";

export type SprintGoalRecord = {
  generalObjective: string | null;
};

export type SprintGoalRepository = {
  getByScope(scope: SprintGoalScope): Promise<SprintGoalRecord | null>;
  /** Garantiza fila padre en `sprint_goals` para el alcance; devuelve su id. */
  ensureByScope(scope: SprintGoalScope): Promise<string>;
  upsertGeneralObjective(
    scope: SprintGoalScope,
    generalObjective: string | null,
  ): Promise<void>;
};
