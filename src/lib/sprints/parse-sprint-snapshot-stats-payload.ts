import type { SprintSnapshotOperationalMetrics, SprintSnapshotStatsPayload } from "@/lib/sprints/sprint-snapshot-types";
import type { SprintStatsScope } from "@/lib/sprints/filter-sprint-stats-scope";
import { parseSprintStatsPayloadFromApi } from "@/lib/sprints/parse-sprint-stats-payload";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLegacyOperationalMetrics(value: unknown): SprintSnapshotOperationalMetrics | null {
  return parseSprintStatsPayloadFromApi(value);
}

export function parseSprintSnapshotStatsPayloadFromApi(
  value: unknown,
): SprintSnapshotStatsPayload | null {
  if (!isRecord(value)) return null;

  if ("team" in value || "goal" in value) {
    const team = parseLegacyOperationalMetrics(value.team);
    const goal = parseLegacyOperationalMetrics(value.goal);
    if (!team || !goal) return null;
    return { team, goal };
  }

  const legacy = parseLegacyOperationalMetrics(value);
  if (!legacy) return null;

  return { team: legacy, goal: legacy };
}

export function resolveSnapshotOperationalMetrics(
  payload: SprintSnapshotStatsPayload,
  scope: SprintStatsScope,
): SprintSnapshotOperationalMetrics {
  return scope === "goal" ? payload.goal : payload.team;
}
