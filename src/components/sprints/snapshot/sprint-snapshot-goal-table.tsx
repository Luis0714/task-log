"use client";

import { SprintSnapshotGoalRow } from "@/components/sprints/snapshot/sprint-snapshot-goal-row";
import {
  countSnapshotGoalsWithTarget,
  listSnapshotDisplayRows,
} from "@/lib/sprints/sprint-snapshot-display";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotGoalTableProps = {
  snapshot: SprintSnapshotData;
};

export function SprintSnapshotGoalTable({ snapshot }: SprintSnapshotGoalTableProps) {
  const rows = listSnapshotDisplayRows(snapshot);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay historias guardadas en esta retrospectiva.
      </p>
    );
  }

  const goalsWithTarget = countSnapshotGoalsWithTarget(rows);

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        {rows.length} historia{rows.length === 1 ? "" : "s"} · {goalsWithTarget} con objetivo
      </p>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
        <div className="inline-block min-w-full rounded-lg border border-border/60 align-middle">
          <table className="w-max min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left">
                <th className="min-w-80 px-3 py-2 font-medium">Historia</th>
                <th className="min-w-32 px-3 py-2 font-medium">Baseline</th>
                <th className="min-w-32 px-3 py-2 font-medium">Objetivo</th>
                <th className="min-w-32 px-3 py-2 font-medium">Final</th>
                <th className="min-w-36 px-3 py-2 font-medium">TAC baseline</th>
                <th className="min-w-36 px-3 py-2 font-medium">TAC objetivo</th>
                <th className="min-w-36 px-3 py-2 font-medium">TAC final</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((story) => (
                <SprintSnapshotGoalRow key={story.workItemId} story={story} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
