import {
  stateMatchesCompletedState,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BugCountsForParent = {
  total: number;
  attended: number;
};

/**
 * Agrupa bugs por HU padre y cuenta cuántos están atendidos.
 * El `bugMapping` se construye con `buildSprintStatusMapping(bugStates)`.
 */
export function buildBugCountsByParentId(
  bugs: readonly Pick<AdoWorkItemOptionDto, "parentId" | "state">[],
  mapping: SprintStatusMapping,
): Map<number, BugCountsForParent> {
  const counts = new Map<number, BugCountsForParent>();

  for (const bug of bugs) {
    const parentId = bug.parentId;
    if (!parentId || parentId <= 0) continue;

    const current = counts.get(parentId) ?? { total: 0, attended: 0 };
    current.total += 1;
    if (stateMatchesCompletedState(bug.state, mapping)) {
      current.attended += 1;
    }
    counts.set(parentId, current);
  }

  return counts;
}

export function attachBugCounts<T extends { id: number }>(
  items: readonly T[],
  bugCountsByParentId: ReadonlyMap<number, BugCountsForParent>,
): Array<T & { bugCount?: number; attendedBugCount?: number }> {
  return items.map((item) => {
    const counts = bugCountsByParentId.get(item.id);
    if (!counts || counts.total <= 0) return item;

    const enriched: T & { bugCount?: number; attendedBugCount?: number } = {
      ...item,
      bugCount: counts.total,
    };

    if (counts.attended > 0) {
      enriched.attendedBugCount = counts.attended;
    }

    return enriched;
  });
}