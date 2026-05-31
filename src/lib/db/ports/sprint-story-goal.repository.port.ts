export type SprintGoalScope = {
  organization: string;
  project: string;
  team: string;
  sprintPath: string;
};

export type SprintStoryGoalRecord = {
  workItemId: number;
  targetStateName: string | null;
  targetTacTagName: string | null;
  baselineStateName: string | null;
  baselineTacTagName: string | null;
  observation: string | null;
};

export type SprintStoryGoalUpsertInput = {
  workItemId: number;
  targetStateName: string | null;
  targetTacTagName: string | null;
  baselineStateName: string | null;
  baselineTacTagName: string | null;
  observation: string | null;
};

export type SprintStoryGoalRepository = {
  listByScope(scope: SprintGoalScope): Promise<SprintStoryGoalRecord[]>;
  replaceScopeGoals(
    scope: SprintGoalScope,
    goals: readonly SprintStoryGoalUpsertInput[],
  ): Promise<void>;
};
