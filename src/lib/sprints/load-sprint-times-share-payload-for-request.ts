import "server-only";

import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { buildSprintTimesSharePayload } from "@/lib/sprints/build-sprint-times-share-payload";
import {
  canShareSprintTimes,
  isSprintTimesShareVariantEnabled,
} from "@/lib/sprints/sprint-times-share-eligibility";
import { resolveSprintStatsScope, SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { loadLiveSprintMetrics } from "@/lib/sprints/load-live-sprint-metrics";
import { loadSprintSnapshotScreen } from "@/lib/sprints/load-sprint-snapshot-screen";
import { resolveSnapshotOperationalMetrics } from "@/lib/sprints/parse-sprint-snapshot-stats-payload";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import type { SprintTimesShareQueryDto } from "@/lib/schemas/sprint-times-share";

export type SprintTimesShareResolvedQuery = SprintTimesShareQueryDto & {
  times: SprintTimesMetrics | null;
};

export type LoadSprintTimesSharePayloadResult =
  | { ok: true; payload: SprintTimesSharePayload }
  | { ok: false; error: string; status: number };

async function loadLiveSprintTimesMetrics(
  scope: SprintGoalScope,
  options: {
    goalOnly: boolean;
    sprintStartDate?: string;
    sprintFinishDate?: string;
  },
): Promise<{ times: SprintTimesMetrics | null; error: string | null }> {
  const result = await loadLiveSprintMetrics(scope, options);

  if (result.error !== null) {
    return { times: null, error: result.error };
  }

  return { times: result.metrics.operational.times, error: null };
}

async function loadFrozenSprintTimesMetrics(
  scope: SprintGoalScope,
  goalOnly: boolean,
): Promise<{ times: SprintTimesMetrics | null; error: string | null }> {
  const screen = await loadSprintSnapshotScreen(scope);

  if (screen.error) {
    return { times: null, error: screen.error };
  }

  if (!screen.snapshot?.statsPayload) {
    return {
      times: null,
      error: "Esta retrospectiva no incluye tiempos congelados para compartir.",
    };
  }

  const operational = resolveSnapshotOperationalMetrics(
    screen.snapshot.statsPayload,
    resolveSprintStatsScope(goalOnly),
  );

  return { times: operational.times, error: null };
}

export async function loadSprintTimesSharePayloadForRequest(
  organization: string,
  query: SprintTimesShareResolvedQuery,
): Promise<LoadSprintTimesSharePayloadResult> {
  const scope: SprintGoalScope = {
    organization,
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  };

  const goalOnly = query.goalOnly ?? SPRINT_STATS_GOAL_ONLY_DEFAULT;

  const times =
    query.times ??
    (await (async () => {
      const finalized = await isSprintScopeFinalized(scope);
      const loaded = finalized
        ? await loadFrozenSprintTimesMetrics(scope, goalOnly)
        : await loadLiveSprintTimesMetrics(scope, {
            goalOnly,
            sprintStartDate: query.sprintStartDate,
            sprintFinishDate: query.sprintFinishDate,
          });
      if (loaded.error) {
        throw new Error(loaded.error);
      }
      return loaded.times;
    })());

  if (!times || !canShareSprintTimes(times)) {
    return {
      ok: false,
      error: "No hay tiempos registrados para compartir en el alcance seleccionado.",
      status: 404,
    };
  }

  if (!isSprintTimesShareVariantEnabled(times, query.variant)) {
    return {
      ok: false,
      error: "La variante seleccionada no está disponible para este sprint.",
      status: 400,
    };
  }

  const dataSourceLabel = query.times
    ? SPRINT_TIMES_SHARE_LABELS.liveDataSource
    : SPRINT_TIMES_SHARE_LABELS.frozenDataSource;

  const payload = buildSprintTimesSharePayload(times, {
    projectName: query.project,
    teamName: query.team,
    sprintName: query.sprintName,
    sprintStartDate: query.sprintStartDate,
    sprintFinishDate: query.sprintFinishDate,
    goalOnly,
    dataSourceLabel,
    variant: query.variant,
    hiddenAssignees: [],
  });

  return { ok: true, payload };
}
