"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  CircleSlash,
  ListPlus,
  Loader2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { TimeLogBulkGroupCard } from "@/components/time-log/time-log-bulk-group-card";
import { TimeLogBulkTask } from "@/components/time-log/time-log-bulk-task";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { useActivityValues } from "@/hooks/use-activity-values";
import { useTimeLogTemplates } from "@/hooks/use-time-log-templates";
import {
  mapBulkTaskIssuesToErrors,
  useBulkGroups,
  type UseBulkGroupsOptions,
} from "@/hooks/time-log/use-bulk-groups";
import { useCreateTasksBatch } from "@/hooks/time-log/use-create-tasks-batch";
import { bulkTaskSchema } from "@/lib/schemas/time-log";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import { BULK_GROUP_LIMIT, type BulkGroup, type BulkTask } from "@/lib/time-log/bulk-group";
import { appToast } from "@/lib/toast";

export type TimeLogBulkFormProps = Readonly<{
  catalog: TimeLogCatalog;
  appendHistory: (entry: CopilotHistoryEntry) => void;
  isTaskCreationMode: boolean;
  /** Lo llama el componente cuando cambia la cantidad de tareas/grupos con datos. */
  onHasDataChange?: (hasData: boolean) => void;
}>;

function taskHasData(task: BulkTask): boolean {
  return (
    Boolean(task.templateId) ||
    Boolean(task.taskTitle.trim()) ||
    Boolean(task.hours.trim()) ||
    Boolean(task.activity.trim()) ||
    Boolean(task.description.trim())
  );
}

function groupHasData(group: BulkGroup): boolean {
  return Boolean(group.pbiId) || group.tasks.some(taskHasData);
}

export function TimeLogBulkForm({
  catalog,
  appendHistory,
  isTaskCreationMode,
  onHasDataChange,
}: TimeLogBulkFormProps) {
  const defaultTaskState = isTaskCreationMode
    ? catalog.defaultOpenTaskState ?? ""
    : catalog.defaultCompletedTaskState ?? "";

  const { templates, loading: templatesLoading, error: templatesError } =
    useTimeLogTemplates();
  const { values: activities } = useActivityValues();

  const bulkGroupsOptions = useMemo<UseBulkGroupsOptions>(
    () => ({
      isTaskCreationMode,
      defaultTaskState,
      // Si el proyecto requiere Activity, ADO rechaza con TF401320 si la
      // tarea llega sin valor. Pre-poblar con la primera actividad del
      // catálogo evita el 422 sin obligar al usuario a seleccionar a mano
      // cuando sólo quiere registrar horas rápidas.
      defaultActivity: activities[0] ?? "",
    }),
    [activities, defaultTaskState, isTaskCreationMode],
  );

  const bulk = useBulkGroups(bulkGroupsOptions);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const batch = useCreateTasksBatch({
    appendHistory,
    getDefaultTaskState: useCallback(
      () => catalog.defaultOpenTaskState ?? "",
      [catalog.defaultOpenTaskState],
    ),
    getDefaultCompletedTaskState: useCallback(
      () => catalog.defaultCompletedTaskState ?? "",
      [catalog.defaultCompletedTaskState],
    ),
  });

  // Track si el usuario tiene datos sin guardar, para que el padre pueda
  // mostrar un confirm antes de cambiar de modo o de sprint.
  const hasData = useMemo(
    () => bulk.groups.some(groupHasData),
    [bulk.groups],
  );
  const onHasDataChangeRef = useRef(onHasDataChange);
  useEffect(() => {
    onHasDataChangeRef.current = onHasDataChange;
  }, [onHasDataChange]);
  useEffect(() => {
    onHasDataChangeRef.current?.(hasData);
  }, [hasData]);

  // Reset silencioso si cambia el sprint: el catálogo de PBIs cambia y los ids
  // seleccionados dejan de ser válidos.
  const previousSprintRef = useRef(catalog.sprintPath);
  useEffect(() => {
    if (
      catalog.sprintPath &&
      previousSprintRef.current &&
      previousSprintRef.current !== catalog.sprintPath
    ) {
      bulk.reset();
    }
    previousSprintRef.current = catalog.sprintPath;
  }, [bulk, catalog.sprintPath]);

  const completedTasksCount = useMemo(
    () =>
      bulk.groups.reduce(
        (acc, g) => acc + g.tasks.filter((t) => t.result?.ok === true).length,
        0,
      ),
    [bulk.groups],
  );

  const canSubmit =
    bulk.validTaskCount > 0 &&
    !batch.loading &&
    Boolean(catalog.sprintPath) &&
    Boolean(catalog.project) &&
    Boolean(catalog.team);

  const validateTask = useCallback((task: BulkTask) => {
    const parsed = bulkTaskSchema.safeParse({
      taskTitle: task.taskTitle,
      hours: task.hours,
      description: task.description,
      activity: task.activity,
      workingDate: task.workingDate,
      workingTime: task.workingTime,
      taskState: task.taskState,
      markAsDone: task.markAsDone,
    });
    if (parsed.success) return { ok: true as const };
    return {
      ok: false as const,
      errors: mapBulkTaskIssuesToErrors(parsed.error.issues),
    };
  }, []);

  const handleAddTask = (groupId: string) => {
    const result = bulk.tryAddTask(groupId, validateTask);
    if (!result.added) {
      const firstField = Object.keys(result.errors)[0] ?? null;
      appToast.error(
        firstField
          ? `Completa los campos de la tarea antes de agregar otra.`
          : `Completa la tarea antes de agregar otra.`,
      );
    }
  };

  const handleAddGroup = () => {
    const result = bulk.tryAddGroup(bulk.groups, validateTask);
    if (!result.added) {
      const firstField = Object.keys(result.errors)[0] ?? null;
      appToast.error(
        firstField
          ? `Completa los campos de las tareas antes de agregar otra historia.`
          : `Completa las tareas de la historia actual antes de agregar otra.`,
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const selectedPbis = new Map<string, NonNullable<TimeLogCatalog["selectedPbi"]>>();
    for (const group of bulk.groups) {
      if (group.pbiId && !selectedPbis.has(group.pbiId)) {
        const found = catalog.pbis.find((p) => String(p.id) === group.pbiId);
        if (found) selectedPbis.set(group.pbiId, found);
      }
    }

    const result = await batch.submit(bulk.groups, {
      selectedPbis,
      project: catalog.project,
      team: catalog.team,
      sprintPath: catalog.sprintPath,
    });

    if (!result) return;

    // Pintamos el resultado por tarea (incluye tareas no enviadas por corte
    // en primera falla; el hook las marca como "No enviado").
    for (const entry of result.results) {
      bulk.setTaskResult(entry.groupId, entry.taskId, {
        ok: entry.ok,
        message: entry.message,
        taskId: entry.taskIdRemote,
        markedAsDone: entry.markedAsDone,
      });
    }

    // Al enviar el lote, colapsamos todas las historias para que el usuario
    // vea de un vistazo el resumen de lo creado y pueda empezar un nuevo
    // envío sin ruido visual.
    if (result.response.successCount > 0) {
      bulk.setOpenGroupId(null);
    }
  };

  const handleClearCompleted = () => {
    if (completedTasksCount === 0) return;
    setConfirmClearOpen(false);
    bulk.clearCompletedTasks();
    appToast.success(
      completedTasksCount === 1
        ? "Tarea completada eliminada."
        : `${completedTasksCount} tareas completadas eliminadas.`,
    );
  };

  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4">
        {isTaskCreationMode ? (
          <Alert>
            <CheckCircle2 aria-hidden />
            <AlertTitle>Creación de tareas en lote</AlertTitle>
            <AlertDescription>
              Cada tarea se creará en Azure DevOps bajo la Historia de Usuario
              seleccionada. Por defecto las tareas se crean en estado abierto;
              marca «Done al crear» por tarea si quieres que se cierren
              automáticamente.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2 aria-hidden />
            <AlertTitle>Las tareas se crearán automáticamente como Done</AlertTitle>
            <AlertDescription>
              {catalog.defaultCompletedTaskState
                ? `Al enviar el lote, cada tarea quedará en «${catalog.defaultCompletedTaskState}» y contará de inmediato en las horas del día.`
                : "Al enviar el lote, cada tarea quedará en Done y contará de inmediato en las horas del día."}
            </AlertDescription>
          </Alert>
        )}

        {catalog.defaultCompletedTaskState === null && !isTaskCreationMode ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertTitle>Sin estado de tarea completado configurado</AlertTitle>
            <AlertDescription>
              No se encontró un estado «Done» por defecto. Revisa la
              configuración del proceso antes de continuar o algunas tareas
              podrían no crearse correctamente.
            </AlertDescription>
          </Alert>
        ) : null}

        <ul
          aria-label="Historias de usuario"
          className="m-0 list-none space-y-3 p-0"
        >
          {bulk.groups.map((group, groupIndex) => (
            <li key={group.id}>
              <TimeLogBulkGroupCard
                group={group}
                index={groupIndex}
                pbis={catalog.pbis}
                isOpen={bulk.openGroupId === group.id}
                onOpenChange={(open) =>
                  bulk.setOpenGroupId(open ? group.id : null)
                }
                canRemove={bulk.canRemoveGroups}
                disabled={batch.loading}
                totalTasks={group.tasks.length}
                completedTasks={
                  group.tasks.filter((t) => t.result?.ok === true).length
                }
                totalHours={Math.round(
                  group.tasks.reduce((acc, t) => {
                    const parsed = Number.parseFloat(t.hours.replace(",", "."));
                    if (taskHasErrors(t)) return acc;
                    return acc + (Number.isFinite(parsed) ? parsed : 0);
                  }, 0) * 100,
                ) / 100}
                pbiError={undefined}
                onPbiChange={(pbiId) => {
                  const nextPbiId = pbiId ?? "";
                  bulk.updateGroupField(group.id, "pbiId", nextPbiId);
                  // Auto-expandimos la primera tarea sólo cuando el usuario
                  // escoge una PBI por primera vez y aún no hay una tarea
                  // abierta en este grupo. Esto evita mostrar el formulario
                  // de la tarea antes de saber a qué historia pertenece.
                  if (
                    nextPbiId &&
                    bulk.openGroupId === group.id &&
                    bulk.openTaskId === null
                  ) {
                    const firstTask = group.tasks[0];
                    if (firstTask) {
                      bulk.setOpenTaskId(group.id, firstTask.id);
                    }
                  }
                }}
                onRemove={() => bulk.removeGroup(group.id)}
              >
                <ul
                  aria-label="Tareas"
                  className="m-0 list-none space-y-3 p-0"
                >
                  {group.tasks.map((task, taskIndex) => (
                    <li key={task.id}>
                      <TimeLogBulkTask
                        task={task}
                        index={taskIndex}
                        templates={templates}
                        templatesLoading={templatesLoading}
                        templatesError={templatesError}
                        activities={activities}
                        taskStates={catalog.taskStates}
                        isTaskCreationMode={isTaskCreationMode}
                        canRemove={group.tasks.length > 1 || bulk.canRemoveGroups}
                        disabled={batch.loading}
                        isOpen={
                          bulk.openGroupId === group.id &&
                          bulk.openTaskId === task.id
                        }
                        onOpenChange={(open) =>
                          bulk.setOpenTaskId(group.id, open ? task.id : null)
                        }
                        onChange={(patch) =>
                          bulk.updateTask(group.id, task.id, patch)
                        }
                        onRemove={() => bulk.removeTask(group.id, task.id)}
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulk.setOpenGroupId(null)}
                    disabled={batch.loading}
                  >
                    <ChevronUp aria-hidden />
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddTask(group.id)}
                    disabled={!bulk.canAddGroup || batch.loading}
                    title={
                      bulk.isAtLimit
                        ? `Máximo ${BULK_GROUP_LIMIT} tareas por envío. Envía las actuales antes de agregar más.`
                        : undefined
                    }
                  >
                    <Plus aria-hidden />
                    Agregar Tarea
                  </Button>
                </div>
              </TimeLogBulkGroupCard>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddGroup}
            disabled={!bulk.canAddGroup || batch.loading}
            title={
              bulk.isAtLimit
                ? `Máximo ${BULK_GROUP_LIMIT} tareas por envío. Envía las actuales antes de agregar más.`
                : undefined
            }
          >
            <ListPlus aria-hidden />
            Agregar Historia
          </Button>

          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span>
              Total Tareas:{" "}
              <strong className="text-foreground">{bulk.totalTaskCount}</strong>
            </span>
            <span>
              Total horas:{" "}
              <strong className="text-foreground">{bulk.totalHours}</strong>
            </span>
          </div>
        </div>

        {batch.error ? <CopilotErrorAlert message={batch.error} /> : null}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="min-h-10 w-full"
          >
            {batch.loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              <>
                <Send aria-hidden />
                Registrar Todo
              </>
            )}
          </Button>
          {completedTasksCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmClearOpen(true)}
              disabled={batch.loading}
              className="self-end"
            >
              <CircleSlash aria-hidden />
              Limpiar tareas completadas ({completedTasksCount})
            </Button>
          ) : null}
        </div>
      </CardContent>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Limpiar tareas completadas?</DialogTitle>
            <DialogDescription>
              {completedTasksCount === 1
                ? "Se eliminará 1 tarea con su registro creado en Azure DevOps."
                : `Se eliminarán ${completedTasksCount} tareas con sus registros creados en Azure DevOps.`}{" "}
              Las tareas con error o pendientes se conservarán para que puedas
              corregirlas o reintentarlas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleClearCompleted}>
              <Trash2 aria-hidden />
              Sí, limpiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function taskHasErrors(task: BulkTask): boolean {
  return Object.values(task.errors).some(Boolean);
}
