"use client";

import { useEffect, useMemo, useState } from "react";

import {
  TaskLoggedHoursHighlight,
  TaskSummaryCard,
} from "@/components/tasks/task-summary-card";
import { WorkItemDescriptionBlock } from "@/components/work-items/work-item-description-block";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { appToast } from "@/lib/toast";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { computeDraftCanSave } from "@/lib/forms/can-submit";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { isDateKeyValid } from "@/lib/validation/date-key";
import { cn } from "@/lib/utils";

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

type SprintDateBounds = {
  min: string | undefined;
  max: string | undefined;
};

type TaskUpdatePayload = {
  project: string;
  state: string;
  workingDate: string;
};

type TaskUpdateResponse = {
  ok: boolean;
  errorMessage?: string;
};

function buildSprintDateBounds(sprintWorkingDays: readonly SprintWorkingDay[]): SprintDateBounds {
  if (sprintWorkingDays.length === 0) {
    return { min: undefined, max: undefined };
  }

  return {
    min: sprintWorkingDays[0]?.value,
    max: sprintWorkingDays[sprintWorkingDays.length - 1]?.value,
  };
}

async function patchTaskWorkItem(taskId: number, payload: TaskUpdatePayload): Promise<TaskUpdateResponse> {
  const res = await fetch(`/api/ado/work-items/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { error?: string; detail?: string };

  if (res.ok) return { ok: true };

  const errorMessage = [body.error, body.detail].filter(Boolean).join(" — ");
  return { ok: false, errorMessage: errorMessage || "No se pudo guardar el estado." };
}

function useTaskDetailDraftController({
  task,
  taskStates,
  statesLoading,
  project,
  sprintWorkingDays,
  saving,
}: {
  task: AdoWorkItemOptionDto | null;
  taskStates: readonly AdoTaskStateDto[];
  statesLoading: boolean;
  project: string | null;
  sprintWorkingDays: readonly SprintWorkingDay[];
  saving: boolean;
}) {
  const [draftState, setDraftState] = useState("");
  const [draftWorkingDate, setDraftWorkingDate] = useState("");

  const stateOptions = useMemo(() => taskStates.map((state) => state.name), [taskStates]);
  const statesReady = !statesLoading && stateOptions.length > 0;
  const sprintDateBounds = useMemo(
    () => buildSprintDateBounds(sprintWorkingDays),
    [sprintWorkingDays],
  );

  useEffect(() => {
    if (!task) return;

    setDraftState(task.state);
    setDraftWorkingDate(task.workingDate?.trim() || getDefaultWorkingDate());
  }, [task?.id, task?.state, task?.workingDate]);

  const initialWorkingDate = task?.workingDate?.trim() ?? "";
  const isStateDirty = Boolean(task && draftState !== task.state);
  const isDateDirty = Boolean(task && draftWorkingDate !== initialWorkingDate);
  const isDirty = isStateDirty || isDateDirty;

  const canSave = computeDraftCanSave({
    isDirty,
    isValid: isDateKeyValid(draftWorkingDate),
    externalReady: statesReady && Boolean(project),
    isSubmitting: saving,
  });

  return {
    draftState,
    setDraftState,
    draftWorkingDate,
    setDraftWorkingDate,
    stateOptions,
    statesReady,
    sprintDateBounds,
    canSave,
  };
}

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
  const [saving, setSaving] = useState(false);
  const {
    draftState,
    setDraftState,
    draftWorkingDate,
    setDraftWorkingDate,
    stateOptions,
    statesReady,
    sprintDateBounds,
    canSave,
  } = useTaskDetailDraftController({
    task,
    taskStates,
    statesLoading,
    project,
    sprintWorkingDays,
    saving,
  });

  async function handleSave() {
    if (!task || !project || !canSave) return;

    setSaving(true);
    try {
      const response = await patchTaskWorkItem(task.id, {
        project,
        state: draftState,
        workingDate: draftWorkingDate,
      });

      if (!response.ok) {
        appToast.error(response.errorMessage || "No se pudo guardar el estado.");
        return;
      }

      appToast.success("Tarea actualizada.");
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
          <SheetTitle>Tarea</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            {task ? (
              <>
                <section className="space-y-1">
                  <Label>Titulo</Label>
                  <p className="text-muted-foreground line-clamp-2 text-sm font-semibold" title={task.title}>
                    {task.title}
                  </p>
                  {task.description?.trim() ? (
                    <WorkItemDescriptionBlock html={task.description} />
                  ) : null}
                </section>
                {task.loggedHours !== undefined ? (
                  <TaskLoggedHoursHighlight hours={task.loggedHours} />
                ) : null}

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
                    Fecha de trabajo en Azure DevOps. Obligatoria al cambiar el estado.
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

                <TaskSummaryCard item={task} showLoggedHoursHighlight={false} />

              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Selecciona una tarea para ver el detalle.
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
