import "server-only";

import { cache } from "react";

import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { logApiError } from "@/lib/errors/log-api-error";
import { enrichSnapshotStatsPayloadAssigneeRows } from "@/lib/sprints/enrich-snapshot-stats-payload";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotScreenSnapshot = {
  snapshot: SprintSnapshotData | null;
  persistenceReady: boolean;
  error: string | null;
};

async function enrichSnapshotAssigneeRows(
  scope: SprintGoalScope,
  snapshot: SprintSnapshotData,
): Promise<SprintSnapshotData> {
  if (!snapshot.statsPayload) return snapshot;

  const assigneeRoster = await loadTeamMembers({
    project: scope.project,
    team: scope.team,
    sprintPath: scope.sprintPath,
    source: "workItems",
  });

  return {
    ...snapshot,
    statsPayload: enrichSnapshotStatsPayloadAssigneeRows(snapshot.statsPayload, assigneeRoster),
  };
}

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
    if (!snapshot) {
      return {
        snapshot: null,
        persistenceReady: true,
        error: null,
      };
    }

    const enrichedSnapshot = await enrichSnapshotAssigneeRows(scope, snapshot);

    return {
      snapshot: enrichedSnapshot,
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
