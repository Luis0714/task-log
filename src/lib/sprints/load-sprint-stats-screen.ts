import "server-only";

import { cache } from "react";

import { isDatabaseConfigured } from "@/lib/db/client";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { loadLiveSprintMetrics } from "@/lib/sprints/load-live-sprint-metrics";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";

export type LoadSprintStatsScreenOptions = {
  goalOnly?: boolean;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
};

export type SprintStatsScreenSnapshot = {
  stats: SprintStatsScreenData | null;
  persistenceReady: boolean;
  isFinalized: boolean;
  error: string | null;
};

export const loadSprintStatsScreen = cache(async function loadSprintStatsScreen(
  scope: SprintGoalScope,
  options: LoadSprintStatsScreenOptions = {},
): Promise<SprintStatsScreenSnapshot> {
  const goalOnly = options.goalOnly ?? SPRINT_STATS_GOAL_ONLY_DEFAULT;
  const persistenceReady = isDatabaseConfigured();
  let isFinalized = false;

  if (persistenceReady) {
    try {
      isFinalized = await isSprintScopeFinalized(scope);
    } catch (cause) {
      logApiError("loadSprintStatsScreen/finalized", cause);
    }
  }

  if (isFinalized) {
    return {
      stats: null,
      persistenceReady,
      isFinalized: true,
      error: null,
    };
  }

  const result = await loadLiveSprintMetrics(scope, {
    goalOnly,
    sprintStartDate: options.sprintStartDate,
    sprintFinishDate: options.sprintFinishDate,
  });

  if (result.error !== null) {
    return {
      stats: null,
      persistenceReady,
      isFinalized: false,
      error: result.error,
    };
  }

  return {
    stats: { goal: result.metrics.goal, ...result.metrics.operational },
    persistenceReady,
    isFinalized: false,
    error: null,
  };
});
