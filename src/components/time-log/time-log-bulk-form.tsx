"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  ListPlus,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { TimeLogBulkRow } from "@/components/time-log/time-log-bulk-row";
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
import { useTaskMeta } from "@/hooks/use-task-meta";
import { useTimeLogTemplates } from "@/hooks/use-time-log-templates";
import {
  mapBulkRowIssuesToErrors,
  useBulkRows,
  type UseBulkRowsOptions,
} from "@/hooks/time-log/use-bulk-rows";
import { useCreateTasksBatch } from "@/hooks/time-log/use-create-tasks-batch";
import { bulkRowSchema } from "@/lib/schemas/time-log";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import { BULK_ROW_LIMIT, type BulkRow } from "@/lib/time-log/bulk-row";
import { appToast } from "@/lib/toast";

export type TimeLogBulkFormProps = Readonly<{
  catalog: TimeLogCatalog;
  appendHistory: (entry: CopilotHistoryEntry) => void;
  isTaskCreationMode: boolean;
  /** Lo llama el componente cuando cambia la cantidad de filas con datos. */
  onHasDataChange?: (hasData: boolean) => void;
}>;

function rowHasData(row: BulkRow): boolean {
  return (
    Boolean(row.pbiId) ||
    Boolean(row.templateId) ||
    Boolean(row.taskTitle.trim()) ||
    Boolean(row.hours.trim()) ||
    Boolean(row.activity.trim()) ||
    Boolean(row.description.trim())
  );
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

  const { templates, loading: templatesLoading } = useTimeLogTemplates();
  // Activities reales del proyecto (mismo origen que el form Individual y
  // que el `SaveAsTemplateDialog`). `useTaskMeta` ya hace fallback a la
  // lista canónica si la API falla o devuelve vacío, así que el select
  // nunca queda sin opciones válidas.
  const { activities } = useTaskMeta();

  const bulkRowsOptions = useMemo<UseBulkRowsOptions>(
    () => ({
      isTaskCreationMode,
      defaultTaskState,
      // Si el proyecto requiere Activity, ADO rechaza con TF401320 si la
      // fila llega sin valor. Pre-poblar con la primera actividad del
      // catálogo evita el 422 sin obligar al usuario a seleccionar a mano
      // cuando sólo quiere registrar horas rápidas.
      defaultActivity: activities[0] ?? "",
    }),
    [activities, defaultTaskState, isTaskCreationMode],
  );

  const bulk = useBulkRows(bulkRowsOptions);

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
    () => bulk.rows.some(rowHasData),
    [bulk.rows],
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

  const completedRowsCount = useMemo(
    () => bulk.rows.filter((row) => row.result?.ok === true).length,
    [bulk.rows],
  );

  const canSubmit =
    bulk.validRowCount > 0 &&
    !batch.loading &&
    Boolean(catalog.sprintPath) &&
    Boolean(catalog.project) &&
    Boolean(catalog.team);

  const handleAddRow = () => {
    const result = bulk.tryAddRow(bulk.rows, (row) => {
      const parsed = bulkRowSchema.safeParse({
        pbiId: row.pbiId,
        taskTitle: row.taskTitle,
        hours: row.hours,
        description: row.description,
        activity: row.activity,
        workingDate: row.workingDate,
        workingTime: row.workingTime,
        taskState: row.taskState,
        markAsDone: row.markAsDone,
      });
      if (parsed.success) return { ok: true };
      return {
        ok: false as const,
        errors: mapBulkRowIssuesToErrors(parsed.error.issues),
      };
    });

    if (!result.added) {
      const blockedIndex = bulk.rows.findIndex(
        (row) => row.id === result.blockedRowId,
      );
      const position = blockedIndex >= 0 ? blockedIndex + 1 : "?";
      const firstField = Object.keys(result.errors)[0] ?? null;
      appToast.error(
        firstField
          ? `Completa los campos de la fila #${position} antes de agregar otra.`
          : `Completa la fila #${position} antes de agregar otra.`,
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const selectedPbis = new Map<string, NonNullable<TimeLogCatalog["selectedPbi"]>>();
    for (const row of bulk.rows) {
      if (row.pbiId && !selectedPbis.has(row.pbiId)) {
        const found = catalog.pbis.find((p) => String(p.id) === row.pbiId);
        if (found) selectedPbis.set(row.pbiId, found);
      }
    }

    const result = await batch.submit(bulk.rows, {
      selectedPbis,
      project: catalog.project,
      team: catalog.team,
      sprintPath: catalog.sprintPath,
    });

    if (!result) return;

    // Pintamos el resultado por fila (incluye filas no enviadas por corte en
    // primera falla; el hook las marca como "No enviado").
    for (const entry of result.results) {
      bulk.setRowResult(entry.rowId, {
        ok: entry.ok,
        message: entry.message,
        taskId: entry.taskId,
        markedAsDone: entry.markedAsDone,
      });
    }
  };

  const handleClearCompleted = () => {
    if (completedRowsCount === 0) return;
    setConfirmClearOpen(false);
    bulk.clearCompletedRows();
    appToast.success(
      completedRowsCount === 1
        ? "Fila completada eliminada."
        : `${completedRowsCount} filas completadas eliminadas.`,
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
              Cada fila creará una tarea nueva en Azure DevOps. Por defecto las
              tareas se crean en estado abierto; marca «Done al crear» por fila
              si quieres que se cierren automáticamente.
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
          aria-label="Registros múltiples de tiempo"
          className="m-0 list-none space-y-3 p-0"
        >
          {bulk.rows.map((row, index) => (
            <li key={row.id}>
              <TimeLogBulkRow
                row={row}
                index={index}
                pbis={catalog.pbis}
                templates={templates}
                templatesLoading={templatesLoading}
                activities={activities}
                taskStates={catalog.taskStates}
                isTaskCreationMode={isTaskCreationMode}
                canRemove={bulk.canRemoveRows}
                disabled={batch.loading}
                isOpen={bulk.openId === row.id}
                onOpenChange={(open) =>
                  bulk.setOpenId(open ? row.id : null)
                }
                onChange={(id, patch) => bulk.updateRow(id, patch)}
                onRemove={(id) => bulk.removeRow(id)}
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            disabled={!bulk.canAddRow || batch.loading}
            title={
              bulk.isAtLimit
                ? `Máximo ${BULK_ROW_LIMIT} registros por envío. Envía los actuales antes de agregar más.`
                : undefined
            }
          >
            <ListPlus aria-hidden />
            Agregar fila
          </Button>

          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span>
              Total registros:{" "}
              <strong className="text-foreground">{bulk.validRowCount}</strong>
            </span>
            <span>
              Total horas:{" "}
              <strong className="text-foreground">{bulk.totalHours}</strong>
            </span>
          </div>
        </div>

        {batch.error ? <CopilotErrorAlert message={batch.error} /> : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {completedRowsCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmClearOpen(true)}
              disabled={batch.loading}
            >
              <CircleSlash aria-hidden />
              Limpiar filas completadas ({completedRowsCount})
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
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
        </div>
      </CardContent>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Limpiar filas completadas?</DialogTitle>
            <DialogDescription>
              {completedRowsCount === 1
                ? "Se eliminará 1 fila con su registro creado en Azure DevOps."
                : `Se eliminarán ${completedRowsCount} filas con sus registros creados en Azure DevOps.`}{" "}
              Las filas con error o pendientes se conservarán para que puedas
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
