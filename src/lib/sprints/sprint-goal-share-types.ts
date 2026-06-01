/** Máximo de filas renderizadas; por encima se muestra aviso de overflow. */
export const SPRINT_GOAL_SHARE_MAX_RENDERED_STORIES = 50;

export type SprintGoalShareStoryRow = {
  workItemId: number;
  title: string;
  /** Punto de partida al comprometer la historia. */
  originalState: string;
  originalTags: string;
  /** Meta definida para el sprint. */
  targetState: string;
  targetTags: string;
  /** Situación actual en ADO al exportar. */
  currentState: string;
  currentTags: string;
};

export type SprintGoalShareSummary = {
  totalStoriesInGoal: number;
  uniqueTargetStates: number;
  uniqueTargetTags: number;
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
