"use client";

import { useState } from "react";

import { TaskLoggedHoursHighlight } from "@/components/tasks/task-logged-hours-highlight";
import { WorkItemAdoQuickLinks } from "@/components/work-items/work-item-ado-quick-links";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { DeleteWorkItemDialog } from "@/components/work-items/delete-work-item-dialog";
import { Button } from "@/components/ui/button";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { appToast } from "@/lib/toast";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { useTaskDetailDraftController } from "@/components/tasks/use-task-detail-draft-controller";
import { useActivityValues } from "@/hooks/use-activity-values";
import { patchTaskWorkItem } from "@/components/tasks/task-work-item.service";
import { cn } from "@/lib/utils";

export type ParentHuOption = {
  id: number;
  title: string;
};

export type TaskDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: AdoWorkItemOptionDto | null;
  taskStates: readonly AdoTaskStateDto[];
  statesLoading?: boolean;
  project: string | null;
  sprintWorkingDays?: readonly SprintWorkingDay[];
  parentHuOptions?: readonly ParentHuOption[];
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
  parentHuOptions = [],
  onSaved,
}: TaskDetailSheetProps) {
  const [saving, setSaving] = useState(false);
  const {
    draftState,
    setDraftState,
    draftWorkingDate,
    setDraftWorkingDate,
    draftWorkingTime,
    setDraftWorkingTime,
    draftTitle,
    setDraftTitle,
    draftDescription,
    setDraftDescription,
    draftActivity,
    setDraftActivity,
    draftHours,
    setDraftHours,
    draftNewParentId,
    setDraftNewParentId,
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

  const { values: activityValues, loading: activitiesLoading } = useActivityValues();

  async function handleSave() {
    if (!task || !project || !canSave) return;

    setSaving(true);
    try {
      const response = await patchTaskWorkItem(task.id, {
        project,
        state: draftState,
        workingDate: draftWorkingDate,
        workingTime: draftWorkingTime,
        title: draftTitle.trim() !== task.title ? draftTitle.trim() : undefined,
        description: draftDescription !== (task.description ?? "") ? draftDescription : undefined,
        activity: draftActivity !== (task.activity ?? "") ? draftActivity : undefined,
        completedWork: draftHours !== task.loggedHours ? draftHours : undefined,
        newParentId: draftNewParentId,
      });

      if (!response.ok) {
        appToast.error(response.errorMessage || "No se pudo guardar la tarea.");
        return;
      }

      appToast.success("Tarea actualizada.");
      onSaved?.();
      onOpenChange(false);
    } catch {
      appToast.error("No se pudo guardar la tarea.");
    } finally {
      setSaving(false);
    }
  }

  const currentParent = task?.parentId
    ? (parentHuOptions.find((o) => o.id === task.parentId) ?? { id: task.parentId, title: task.parentTitle ?? `HU #${task.parentId}` })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar tarea</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-5 pb-4">
            {task ? (
              <>
                <WorkItemAdoQuickLinks
                  project={project}
                  links={[
                    { workItemId: task.id, label: `Tarea #${task.id}` },
                    ...(task.parentId
                      ? [{ workItemId: task.parentId, label: `HU #${task.parentId}` }]
                      : []),
                  ]}
                />

                <section className="space-y-2">
                  <Label htmlFor="task-title">Título</Label>
                  <Input
                    id="task-title"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    disabled={saving}
                    placeholder="Título de la tarea"
                  />
                </section>

                <section className="space-y-2">
                  <Label htmlFor="task-description">Descripción</Label>
                  <Textarea
                    id="task-description"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    disabled={saving}
                    placeholder="Descripción (opcional)"
                    rows={3}
                    className="resize-none"
                  />
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <section className="space-y-2">
                    <Label htmlFor="task-activity">Actividad</Label>
                    {activitiesLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : activityValues.length > 0 ? (
                      <Select
                        value={draftActivity || undefined}
                        onValueChange={(v) => setDraftActivity(v ?? "")}
                        disabled={saving}
                      >
                        <SelectTrigger id="task-activity" className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityValues.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="task-activity"
                        value={draftActivity}
                        onChange={(e) => setDraftActivity(e.target.value)}
                        disabled={saving}
                        placeholder="Actividad"
                      />
                    )}
                  </section>

                  <section className="space-y-2">
                    <Label htmlFor="task-hours">Horas registradas</Label>
                    <Input
                      id="task-hours"
                      type="number"
                      min={0}
                      max={9999}
                      step={0.5}
                      value={draftHours ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        setDraftHours(val !== undefined && Number.isFinite(val) ? val : undefined);
                      }}
                      disabled={saving}
                      placeholder="0"
                    />
                  </section>
                </div>

                <section className="space-y-2">
                  <Label htmlFor="task-working-date">Fecha y hora de trabajo</Label>
                  <DatePickerTime
                    dateId="task-working-date"
                    timeId="task-working-time"
                    dateValue={draftWorkingDate}
                    timeValue={draftWorkingTime}
                    min={sprintDateBounds.min}
                    max={sprintDateBounds.max}
                    disabled={saving}
                    onDateChange={setDraftWorkingDate}
                    onTimeChange={setDraftWorkingTime}
                  />
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

                {parentHuOptions.length > 0 || currentParent ? (
                  <section className="space-y-2">
                    <Label htmlFor="task-parent-hu">HU padre</Label>
                    {(() => {
                      const allHuOptions = [
                        ...(currentParent && !parentHuOptions.some((o) => o.id === currentParent.id)
                          ? [currentParent]
                          : []),
                        ...parentHuOptions,
                      ];
                      const selectedId = draftNewParentId ?? task.parentId;
                      const selectedHu = allHuOptions.find((o) => o.id === selectedId);
                      return (
                        <Select
                          value={selectedId !== undefined ? String(selectedId) : ""}
                          onValueChange={(v) => {
                            const id = Number(v);
                            setDraftNewParentId(id !== task.parentId ? id : undefined);
                          }}
                          disabled={saving}
                        >
                          <SelectTrigger id="task-parent-hu" className="w-full">
                            <SelectValue placeholder="Selecciona HU padre">
                              {selectedHu ? selectedHu.title : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {allHuOptions.map((hu) => (
                              <SelectItem key={hu.id} value={String(hu.id)}>
                                #{hu.id} {hu.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </section>
                ) : null}

                {task.loggedHours !== undefined ? (
                  <TaskLoggedHoursHighlight hours={task.loggedHours} />
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Selecciona una tarea para ver el detalle.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className={cn("border-t flex-row gap-2")}>
          {task && project ? (
            <DeleteWorkItemDialog
              workItemId={task.id}
              project={project}
              itemLabel="tarea"
              disabled={saving}
              className="flex-1"
              onDeleted={() => {
                onSaved?.();
                onOpenChange(false);
              }}
            />
          ) : null}
          <Button
            type="button"
            className="flex-1"
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
