"use client";

import { useEffect, useMemo, useState } from "react";

import { TaskSummaryCard } from "@/components/tasks/task-summary-card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { appToast } from "@/lib/toast";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { cn } from "@/lib/utils";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type TaskDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: AdoWorkItemOptionDto | null;
  taskStates: readonly AdoTaskStateDto[];
  statesLoading?: boolean;
  project: string | null;
  sprintWorkingDays?: readonly SprintWorkingDay[];
  onSaved?: () => void;
};

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  taskStates,
  statesLoading = false,
  project,
  sprintWorkingDays = [],
  onSaved,
}: TaskDetailSheetProps) {
  const [draftState, setDraftState] = useState("");
  const [draftWorkingDate, setDraftWorkingDate] = useState("");
  const [saving, setSaving] = useState(false);

  const stateOptions = useMemo(() => taskStates.map((state) => state.name), [taskStates]);
  const statesReady = !statesLoading && stateOptions.length > 0;

  const sprintDateBounds = useMemo(() => {
    if (sprintWorkingDays.length === 0) return { min: undefined, max: undefined };
    return {
      min: sprintWorkingDays[0]?.value,
      max: sprintWorkingDays[sprintWorkingDays.length - 1]?.value,
    };
  }, [sprintWorkingDays]);

  useEffect(() => {
    if (task) {
      setDraftState(task.state);
      setDraftWorkingDate(task.workingDate?.trim() || getDefaultWorkingDate());
    }
  }, [task?.id, task?.state, task?.workingDate]);

  const initialWorkingDate = task?.workingDate?.trim() ?? "";
  const isStateDirty = Boolean(task && draftState !== task.state);
  const isDateDirty = Boolean(task && draftWorkingDate !== initialWorkingDate);
  const isDirty = isStateDirty || isDateDirty;
  const hasValidDate = DATE_KEY_PATTERN.test(draftWorkingDate);
  const canSave = isDirty && hasValidDate && statesReady && Boolean(project) && !saving;

  async function handleSave() {
    if (!task || !project || !canSave) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/ado/work-items/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          state: draftState,
          workingDate: draftWorkingDate,
        }),
      });
      const payload = (await res.json()) as { error?: string; detail?: string };

      if (!res.ok) {
        const message = [payload.error, payload.detail].filter(Boolean).join(" — ");
        appToast.error(message || "No se pudo guardar el estado.");
        return;
      }

      appToast.success("Task actualizada.");
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
          <SheetTitle>Task</SheetTitle>
          <SheetDescription
            className={cn(task && "line-clamp-2 text-pretty text-foreground/80")}
            title={task?.title}
          >
            {task?.title ?? "Selecciona una task para ver el detalle."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            {task ? (
              <>
                <TaskSummaryCard item={task} />

                <section className="space-y-2">
                  <Label htmlFor="task-working-date">Fecha de trabajo</Label>
                  <DatePicker
                    id="task-working-date"
                    value={draftWorkingDate}
                    min={sprintDateBounds.min}
                    max={sprintDateBounds.max}
                    disabled={saving}
                    onChange={setDraftWorkingDate}
                  />
                  <p className="text-muted-foreground text-xs">
                    Working Date en Azure DevOps. Obligatoria al cambiar el estado.
                  </p>
                </section>

                <section className="space-y-2">
                  <Label htmlFor="task-state">Estado</Label>
                  {statesLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={draftState || undefined}
                      onValueChange={(value) => setDraftState(value ?? "")}
                      disabled={!statesReady || saving}
                    >
                      <SelectTrigger id="task-state" className="w-full">
                        <SelectValue
                          placeholder={
                            statesReady ? "Selecciona un estado" : "Estados no disponibles"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stateOptions.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </section>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Selecciona una task para ver el detalle.
              </p>
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
