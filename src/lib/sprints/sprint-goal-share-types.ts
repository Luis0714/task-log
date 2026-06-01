/** Máximo de filas renderizadas; por encima se muestra aviso de overflow. */
export const SPRINT_GOAL_SHARE_MAX_RENDERED_STORIES = 50;

export type SprintGoalShareStoryRow = {
  workItemId: number;
  title: string;
  targetState: string;
  targetTac: string;
};

export type SprintGoalShareSummary = {
  totalStoriesInGoal: number;
  uniqueTargetStates: number;
  uniqueTargetTacs: number;
};

export type SprintGoalSharePayload = {
  generatedAt: Date;
  platformName: string;
  projectName: string;
  teamName: string;
  sprintName: string;
  sprintDateRange: string | null;
  generalObjective: string;
  summary: SprintGoalShareSummary;
  visibleStories: SprintGoalShareStoryRow[];
  overflowCount: number;
  scopeLabel: string;
};

export type SprintGoalShareContext = {
  projectName: string;
  teamName: string;
  sprintName: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
  generalObjective: string;
};
