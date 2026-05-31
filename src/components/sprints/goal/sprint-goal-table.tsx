"use client";

import { SprintGoalRow } from "@/components/sprints/goal/sprint-goal-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import type { SprintStoryGoalDraft } from "@/lib/sprints/sprint-story-goal";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";
import { partitionSprintStoryGoalRowsByInclusion } from "@/lib/sprints/sort-sprint-story-goal-rows";

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

type SprintGoalTableSectionProps = Pick<
  SprintGoalTableProps,
  | "drafts"
  | "backlogStates"
  | "catalogTags"
  | "disabled"
  | "onDraftChange"
  | "getRowValidationMessage"
> & {
  title: string;
  rows: readonly SprintStoryGoalRowModel[];
};

function SprintGoalTableSection({
  title,
  rows,
  drafts,
  backlogStates,
  catalogTags,
  disabled = false,
  onDraftChange,
  getRowValidationMessage,
}: SprintGoalTableSectionProps) {
  const draftByWorkItemId = new Map(drafts.map((draft) => [draft.workItemId, draft]));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
        <div className="inline-block min-w-full rounded-lg border border-border/60 align-middle">
          <table className="w-max min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left">
                <th className="min-w-80 px-3 py-2 font-medium">Historia</th>
                <th className="min-w-40 px-3 py-2 font-medium">Estado objetivo</th>
                <th className="min-w-48 px-3 py-2 font-medium">TAC objetivo</th>
                <th className="w-16 px-2 py-2 text-center font-medium">Incluida</th>
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
    </div>
  );
}

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

  const { included, excluded } = partitionSprintStoryGoalRowsByInclusion(rows);

  return (
    <div className="flex flex-col gap-6">
      {included.length > 0 ? (
        <SprintGoalTableSection
          title={`Incluidas en el objetivo (${included.length})`}
          rows={included}
          drafts={drafts}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={disabled}
          onDraftChange={onDraftChange}
          getRowValidationMessage={getRowValidationMessage}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Ninguna historia incluida en el objetivo del sprint.
        </p>
      )}

      {excluded.length > 0 ? (
        <SprintGoalTableSection
          title={`No incluidas en el objetivo (${excluded.length})`}
          rows={excluded}
          drafts={drafts}
          backlogStates={backlogStates}
          catalogTags={catalogTags}
          disabled={disabled}
          onDraftChange={onDraftChange}
          getRowValidationMessage={getRowValidationMessage}
        />
      ) : null}
    </div>
  );
}
