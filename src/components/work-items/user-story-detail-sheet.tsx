"use client";

import { useMemo } from "react";

import { WorkItemDescriptionBlock } from "@/components/work-items/work-item-description-block";
import { UserStoryResponsableFields } from "@/components/work-items/user-story-responsable-fields";
import { UserStorySchedulingFields } from "@/components/work-items/user-story-scheduling-fields";
import { UserStorySummaryCard } from "@/components/work-items/user-story-summary-card";
import { UserStoryWorkflowTagField } from "@/components/work-items/user-story-workflow-tag-field";
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
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { useUserStoryDetailForm } from "@/hooks/work-items/use-user-story-detail-form";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { appToast } from "@/lib/toast";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTaskStateDto, AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { getWorkItemStatePresentation } from "@/lib/time-log/work-item-presentation";
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

function BugListItem({
  bug,
  onClick,
}: {
  bug: AdoWorkItemOptionDto;
  onClick?: (bug: AdoWorkItemOptionDto) => void;
}) {
  const presentation = bug.state ? getWorkItemStatePresentation(bug.state) : null;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30",
        !presentation && "border-border/60 bg-muted/20",
      )}
      onClick={() => onClick?.(bug)}
      disabled={!onClick}
      style={presentation?.surfaceStyle}
    >
      <div className="min-w-0 flex-1">
        <WorkItemId id={bug.id} />
        <p className="text-foreground mt-1.5 text-sm leading-snug" title={bug.title}>
          {bug.title}
        </p>
      </div>
      {bug.state ? (
        <WorkItemStateBadge state={bug.state} className="max-w-[42%] shrink-0" />
      ) : null}
    </button>
  );
}

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
                <UserStorySummaryCard item={workItem} />

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

                <UserStoryWorkflowTagField
                  value={form.draftWorkflowTag}
                  onChange={form.setDraftWorkflowTag}
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
                      values={{
                        maquetacion: form.draftMaquetacion,
                        integrador: form.draftIntegrador,
                        qa: form.draftQa,
                      }}
                      members={members}
                      membersLoading={membersLoading}
                      disabled={form.saving}
                      required={form.transitionKind === "qa"}
                      onChange={(key, value) => {
                        if (key === "maquetacion") form.setDraftMaquetacion(value);
                        if (key === "integrador") form.setDraftIntegrador(value);
                        if (key === "qa") form.setDraftQa(value);
                      }}
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
                        <BugListItem key={bug.id} bug={bug} onClick={onBugClick} />
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
