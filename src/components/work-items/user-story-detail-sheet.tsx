"use client";

import { useEffect, useMemo, useState } from "react";

import { UserStorySummaryCard } from "@/components/work-items/user-story-summary-card";
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
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { appToast } from "@/lib/toast";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
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
  onSaved,
}: UserStoryDetailSheetProps) {
  const [draftState, setDraftState] = useState("");
  const [saving, setSaving] = useState(false);

  const childBugs = useMemo(
    () => (workItem ? filterBugsForParent(bugs, workItem.id) : []),
    [bugs, workItem],
  );

  const stateOptions = useMemo(
    () => backlogStates.map((state) => state.name),
    [backlogStates],
  );

  const statesReady = !statesLoading && stateOptions.length > 0;

  useEffect(() => {
    if (workItem) {
      setDraftState(workItem.state);
    }
  }, [workItem?.id, workItem?.state]);

  const isDirty = Boolean(workItem && draftState !== workItem.state);
  const canSave = isDirty && statesReady && Boolean(project) && !saving;

  async function handleSave() {
    if (!workItem || !project || !canSave) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/ado/work-items/${workItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          state: draftState,
          ...(workItem.workingDate ? { workingDate: workItem.workingDate } : {}),
        }),
      });
      const payload = (await res.json()) as { error?: string; detail?: string };

      if (!res.ok) {
        const message = [payload.error, payload.detail].filter(Boolean).join(" — ");
        appToast.error(message || "No se pudo guardar el estado.");
        return;
      }

      appToast.success("Estado actualizado.");
      onSaved?.();
      onOpenChange(false);
    } catch {
      appToast.error("No se pudo guardar el estado.");
    } finally {
      setSaving(false);
    }
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
                    value={draftState || undefined}
                    onValueChange={(value) => setDraftState(value ?? "")}
                    disabled={!statesReady || saving}
                  >
                    <SelectTrigger id="user-story-state" className="w-full">
                      <SelectValue
                        placeholder={
                          statesReady ? "Selecciona un estado" : "Estados no disponibles"
                        }
                      >
                        {draftState ? <WorkItemStateLabel state={draftState} /> : null}
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Selecciona una historia para ver el detalle.</p>
          )}
          </div>
        </div>

        <SheetFooter className={cn("border-t pt-4")}>
          <Button
            type="button"
            className="w-full"
            disabled={!canSave}
            onClick={() => void handleSave()}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
