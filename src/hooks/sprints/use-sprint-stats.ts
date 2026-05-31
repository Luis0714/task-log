"use client";

import { useCallback, useEffect, useState } from "react";

import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";
import {
  fetchSprintStats,
  type SprintStatsQuery,
} from "@/services/sprints/sprint-stats.service";

export type UseSprintStatsOptions = SprintStatsQuery & {
  enabled?: boolean;
};

export type UseSprintStatsResult = {
  stats: SprintStatsScreenData | null;
  loading: boolean;
  error: string | null;
  goalOnly: boolean;
  setGoalOnly: (value: boolean) => void;
  reload: () => void;
};

export function useSprintStats({
  project,
  team,
  sprintPath,
  sprintStartDate,
  sprintFinishDate,
  enabled = true,
}: UseSprintStatsOptions): UseSprintStatsResult {
  const [stats, setStats] = useState<SprintStatsScreenData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [goalOnly, setGoalOnly] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled || !sprintPath) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchSprintStats(
      { project, team, sprintPath, goalOnly, sprintStartDate, sprintFinishDate },
      controller.signal,
    )
      .then((response) => {
        if (response.isFinalized) {
          setStats(null);
          return;
        }
        setStats(response.stats);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar las estadísticas del sprint.";
        setError(message);
        setStats(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, sprintPath, project, team, goalOnly, sprintStartDate, sprintFinishDate, reloadToken]);

  useEffect(() => {
    setGoalOnly(false);
  }, [project, team, sprintPath]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { stats, loading, error, goalOnly, setGoalOnly, reload };
}
