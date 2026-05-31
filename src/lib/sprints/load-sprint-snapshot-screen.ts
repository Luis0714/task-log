import "server-only";

import { cache } from "react";

import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotScreenSnapshot = {
  snapshot: SprintSnapshotData | null;
  persistenceReady: boolean;
  error: string | null;
};

export const loadSprintSnapshotScreen = cache(async function loadSprintSnapshotScreen(
  scope: SprintGoalScope,
): Promise<SprintSnapshotScreenSnapshot> {
  if (!isDatabaseConfigured()) {
    return {
      snapshot: null,
      persistenceReady: false,
      error: null,
    };
  }

  try {
    const snapshot = await getRepositories().sprintSnapshot.getLatestByScope(scope);
    return {
      snapshot,
      persistenceReady: true,
      error: null,
    };
  } catch (cause) {
    logApiError("loadSprintSnapshotScreen", cause);
    return {
      snapshot: null,
      persistenceReady: false,
      error: "No se pudo cargar la retrospectiva del sprint.",
    };
  }
});
