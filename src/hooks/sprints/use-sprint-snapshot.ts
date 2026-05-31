"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import {
  fetchSprintSnapshot,
  finalizeSprintSnapshot as finalizeSprintSnapshotRequest,
  type SprintSnapshotQuery,
} from "@/services/sprints/sprint-snapshot.service";

export type UseSprintSnapshotOptions = SprintSnapshotQuery & {
  sprint: AdoSprintDto | null;
  enabled?: boolean;
};

export type UseSprintSnapshotResult = {
  snapshot: SprintSnapshotData | null;
  loading: boolean;
  finalizing: boolean;
  error: string | null;
  persistenceReady: boolean;
  isFinalized: boolean;
  isPastSprint: boolean;
  canFinalize: boolean;
  reload: () => void;
  finalize: () => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function useSprintSnapshot({
  project,
  team,
  sprintPath,
  sprint,
  enabled = true,
}: UseSprintSnapshotOptions): UseSprintSnapshotResult {
  const [snapshot, setSnapshot] = useState<SprintSnapshotData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const query = { project, team, sprintPath };
  const isPastSprint = sprint?.timeFrame === "past";
  const isFinalized = snapshot !== null;
  const canFinalize =
    enabled &&
    Boolean(sprintPath) &&
    persistenceReady &&
    !loading &&
    !finalizing;

  useEffect(() => {
    if (!enabled || !sprintPath) {
      setSnapshot(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchSprintSnapshot(query, controller.signal)
      .then((response) => {
        setSnapshot(response.snapshot);
        setPersistenceReady(response.persistenceReady);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar la retrospectiva del sprint.";
        setError(message);
        setSnapshot(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, sprintPath, project, team, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const finalize = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!sprint || !canFinalize) {
      return { ok: false, message: "No se puede finalizar este sprint ahora." };
    }

    setFinalizing(true);
    try {
      const result = await finalizeSprintSnapshotRequest({
        ...query,
        sprintName: sprint.name,
        sprintStartDate: sprint.startDate,
        sprintFinishDate: sprint.finishDate,
        source: "manual",
      });

      if (!result.ok) {
        return { ok: false, message: result.errorMessage };
      }

      setSnapshot(result.snapshot);
      setError(null);
      return { ok: true };
    } finally {
      setFinalizing(false);
    }
  }, [canFinalize, query, sprint]);

  return {
    snapshot,
    loading,
    finalizing,
    error,
    persistenceReady,
    isFinalized,
    isPastSprint,
    canFinalize,
    reload,
    finalize,
  };
}
