"use client";

import { useMemo } from "react";

import { BacklogFieldReferenceHelp } from "@/components/work-items/backlog-field-reference-help";
import { UserStoryResponsableFields } from "@/components/work-items/user-story-responsable-fields";
import { UserStorySchedulingFields } from "@/components/work-items/user-story-scheduling-fields";
import { UserStorySummaryCard } from "@/components/work-items/user-story-summary-card";
import { useAdoBacklogFields } from "@/hooks/use-ado-backlog-fields";
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
  SheetDescription,
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
  statesLoading?: boolean;
  project: string | null;
  team: string | null;
  currentUserDisplayName: string | null;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  onSaved?: () => void;
};

function BugListItem({ bug }: { bug: AdoWorkItemOptionDto }) {
  const presentation = bug.state ? getWorkItemStatePresentation(bug.state) : null;

  return (
    <li
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
        !presentation && "border-border/60 bg-muted/20",
      )}
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
    </li>
  );
}

export function UserStoryDetailSheet({
  open,
  onOpenChange,
  workItem,
  bugs,
  backlogStates,
  statesLoading = false,
  project,
  team,
  currentUserDisplayName,
  members,
  membersLoading = false,
  onSaved,
}: UserStoryDetailSheetProps) {
  const {
    data: backlogFieldsMeta,
    loading: backlogFieldsLoading,
  } = useAdoBacklogFields(project ?? undefined, open && Boolean(project));

  const form = useUserStoryDetailForm({
    workItem,
    project,
    team,
    currentUserDisplayName,
    members,
    responsableFields: backlogFieldsMeta?.fields ?? [],
    onSaved,
    onClose: () => onOpenChange(false),
  });

  const childBugs = useMemo(
    () => (workItem ? filterBugsForParent(bugs, workItem.id) : []),
    [bugs, workItem],
  );

  const stateOptions = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const statesReady = !statesLoading && stateOptions.length > 0;

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
          <SheetDescription
            className={cn(workItem && "line-clamp-2 text-pretty text-foreground/80")}
            title={workItem?.title}
          >
            {workItem?.title ?? "Selecciona una historia para ver el detalle."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            {workItem ? (
              <>
                <UserStorySummaryCard item={workItem} />

                <section className="space-y-2">
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    Bugs ({childBugs.length})
                  </h3>
                  {childBugs.length === 0 ? (
                    <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
                      No hay bugs vinculados a esta historia.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {childBugs.map((bug) => (
                        <BugListItem key={bug.id} bug={bug} />
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <Label htmlFor="user-story-state">Estado</Label>
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

                <UserStorySchedulingFields
                  startDate={form.draftStartDate}
                  targetDate={form.draftTargetDate}
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
                      fields={backlogFieldsMeta?.fields ?? []}
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

                <BacklogFieldReferenceHelp
                  metadata={backlogFieldsMeta}
                  loading={backlogFieldsLoading}
                />
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
            disabled={!form.canSave || !statesReady}
            onClick={() => void handleSave()}
          >
            {form.saving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
