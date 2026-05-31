"use client";

import { SprintGoalShareActions } from "@/components/sprints/goal/sprint-goal-share-actions";
import { SprintSnapshotGoalTable } from "@/components/sprints/snapshot/sprint-snapshot-goal-table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { canShareSnapshotSprintGoal } from "@/lib/sprints/sprint-goal-share-eligibility";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotGoalViewProps = {
  snapshot: SprintSnapshotData;
  project: string;
  team: string;
  sprintPath: string;
};

export function SprintSnapshotGoalView({
  snapshot,
  project,
  team,
  sprintPath,
}: SprintSnapshotGoalViewProps) {
  const generalObjective = snapshot.generalObjective?.trim() ?? "";
  const sprintName = snapshot.sprintName?.trim() || "Sprint";
  const canShare = canShareSnapshotSprintGoal(snapshot.stories);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="sprint-snapshot-general-objective" className="text-xs">
          Objetivo general
        </Label>
        <Textarea
          id="sprint-snapshot-general-objective"
          lang="es"
          value={generalObjective}
          readOnly
          disabled
          rows={3}
          placeholder="Sin objetivo general registrado."
        />
      </div>

      <SprintSnapshotGoalTable snapshot={snapshot} />

      <div className="flex justify-end">
        <SprintGoalShareActions
          project={project}
          team={team}
          sprintPath={sprintPath}
          sprintName={sprintName}
          sprintStartDate={snapshot.sprintStartDate ?? undefined}
          sprintFinishDate={snapshot.sprintFinishDate ?? undefined}
          canShare={canShare}
        />
      </div>
    </div>
  );
}
