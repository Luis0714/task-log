"use client";

import { SprintGoalRow } from "@/components/sprints/goal/sprint-goal-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraft } from "@/lib/sprints/sprint-story-goal";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";

export type SprintGoalTableProps = {
  rows: readonly SprintStoryGoalRowModel[];
  drafts: readonly SprintStoryGoalDraft[];
  backlogStates: readonly AdoTaskStateDto[];
  catalogTags: readonly AdoWorkItemTagDto[];
  loading?: boolean;
  disabled?: boolean;
  onDraftChange: (
    workItemId: number,
    patch: Partial<Omit<SprintStoryGoalDraft, "workItemId">>,
  ) => void;
  getRowValidationMessage: (workItemId: number) => string | null;
};

export function SprintGoalTable({
  rows,
  drafts,
  backlogStates,
  catalogTags,
  loading = false,
  disabled = false,
  onDraftChange,
  getRowValidationMessage,
}: SprintGoalTableProps) {
  const draftByWorkItemId = new Map(drafts.map((draft) => [draft.workItemId, draft]));

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Este sprint no tiene historias de usuario asignadas.
      </p>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
      <div className="inline-block min-w-full rounded-lg border border-border/60 align-middle">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left">
              <th className="min-w-80 px-3 py-2 font-medium">Historia</th>
              <th className="min-w-40 px-3 py-2 font-medium">Estado objetivo</th>
              <th className="min-w-48 px-3 py-2 font-medium">TAC objetivo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draft = draftByWorkItemId.get(row.workItem.id) ?? row.draft;
              return (
                <SprintGoalRow
                  key={row.workItem.id}
                  workItem={row.workItem}
                  draft={draft}
                  backlogStates={backlogStates}
                  catalogTags={catalogTags}
                  disabled={disabled}
                  validationMessage={getRowValidationMessage(row.workItem.id)}
                  onDraftChange={(patch) => onDraftChange(row.workItem.id, patch)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
