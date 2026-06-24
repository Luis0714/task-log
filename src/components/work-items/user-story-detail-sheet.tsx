"use client";

import { useMemo } from "react";

import { WorkItemDescriptionBlock } from "@/components/work-items/work-item-description-block";
import { UserStoryBugListItem } from "@/components/work-items/user-story-bug-list-item";
import { UserStoryResponsableFields } from "@/components/work-items/user-story-responsable-fields";
import { UserStorySchedulingFields } from "@/components/work-items/user-story-scheduling-fields";
import { UserStorySummaryCard } from "@/components/work-items/user-story-summary-card";
import { WorkItemAdoQuickLinks } from "@/components/work-items/work-item-ado-quick-links";
import { UserStoryTagsField } from "@/components/work-items/user-story-tags-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { useUserStoryDetailForm } from "@/hooks/work-items/use-user-story-detail-form";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { appToast } from "@/lib/toast";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTaskStateDto, AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { filterBugsForParent } from "@/lib/work-items/bugs-for-parent";
import { cn } from "@/lib/utils";

export type UserStoryDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workItem: DashboardWorkItem | null;
  bugs: readonly AdoWorkItemOptionDto[];
  backlogStates: readonly AdoTaskStateDto[];
  responsableFields: readonly BacklogResponsableFieldDto[];
  statesLoading?: boolean;
  project: string | null;
  team: string | null;
  currentUserDisplayName: string | null;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  onBugClick?: (bug: AdoWorkItemOptionDto) => void;
  onSaved?: () => void;
};

export function UserStoryDetailSheet({
  open,
  onOpenChange,
  workItem,
  bugs,
  backlogStates,
  responsableFields,
  statesLoading = false,
  project,
  team,
  currentUserDisplayName,
  members,
  membersLoading = false,
  onBugClick,
  onSaved,
}: UserStoryDetailSheetProps) {
  const stateOptions = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const statesReady = !statesLoading && stateOptions.length > 0;

  const form = useUserStoryDetailForm({
    workItem,
    project,
    team,
    currentUserDisplayName,
    members,
    responsableFields,
    statesReady,
    onSaved,
    onClose: () => onOpenChange(false),
  });

  const childBugs = useMemo(
    () => (workItem ? filterBugsForParent(bugs, workItem.id) : []),
    [bugs, workItem],
  );

  async function handleSave() {
    const result = await form.save();
    if (result.ok) {
      appToast.success("Estado actualizado.");
      return;
    }
    appToast.error(result.message);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Historia de usuario</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            {workItem ? (
              <>
                <section className="space-y-1">
                  <Label>Titulo</Label>
                  <p className="text-muted-foreground line-clamp-2 text-sm font-semibold" title={workItem.title}>
                    {workItem.title}
                  </p>
                  {workItem.description?.trim() ? (
                    <WorkItemDescriptionBlock html={workItem.description} />
                  ) : null}
                </section>
                <WorkItemAdoQuickLinks
                  project={project}
                  links={[{ workItemId: workItem.id, label: `HU #${workItem.id}` }]}
                />
                <UserStorySummaryCard item={workItem} project={project} />

                <section className="space-y-2">
                  <Label htmlFor="user-story-state" required>
                    Estado
                  </Label>
                  {statesLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={form.draftState || undefined}
                      onValueChange={(value) => form.setDraftState(value ?? "")}
                      disabled={!statesReady || form.saving}
                    >
                      <SelectTrigger id="user-story-state" className="w-full">
                        <SelectValue
                          placeholder={
                            statesReady ? "Selecciona un estado" : "Estados no disponibles"
                          }
                        >
                          {form.draftState ? (
                            <WorkItemStateLabel state={form.draftState} />
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {stateOptions.map((state) => (
                          <SelectItem key={state} value={state}>
                            <WorkItemStateLabel state={state} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </section>

                <UserStoryTagsField
                  project={project}
                  value={form.draftTags}
                  onChange={form.setDraftTags}
                  disabled={form.saving}
                />

                <UserStorySchedulingFields
                  startDate={form.draftStartDate}
                  targetDate={form.draftTargetDate}
                  required
                  disabled={form.saving}
                  onStartDateChange={form.setDraftStartDate}
                  onTargetDateChange={form.setDraftTargetDate}
                />

                {form.hasResponsableFields ? (
                  <section className="space-y-2">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                      Responsables
                    </h3>
                    <UserStoryResponsableFields
                      fields={responsableFields}
                      values={form.draftResponsables}
                      members={members}
                      membersLoading={membersLoading}
                      disabled={form.saving}
                      required={form.transitionKind === "qa"}
                      onChange={(referenceName, value) =>
                        form.setResponsableValue(referenceName, value)
                      }
                    />
                  </section>
                ) : null}

                <section className="space-y-2">
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    Bugs ({childBugs.length})
                  </h3>
                  {childBugs.length === 0 ? (
                    <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
                      No hay Bugs vinculados a esta historia.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {childBugs.map((bug) => (
                        <UserStoryBugListItem
                          key={bug.id}
                          bug={bug}
                          project={project}
                          onClick={onBugClick}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Selecciona una historia para ver el detalle.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className={cn("border-t pt-4")}>
          <Button
            type="button"
            className="w-full"
            disabled={!form.canSave}
            onClick={() => void handleSave()}
          >
            {form.saving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
