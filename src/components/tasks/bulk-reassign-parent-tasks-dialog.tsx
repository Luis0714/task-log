"use client";

import { useCallback, useState } from "react";
import { GitFork } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PbiSelectComboboxField } from "@/components/time-log/fields/pbi-select-combobox-field";
import { Skeleton } from "@/components/ui/skeleton";
import { bulkReassignWorkItemsParent } from "@/components/tasks/task-bulk.service";
import { showStatusSummary } from "@/components/tasks/bulk-change-status-tasks-dialog";
import { useBacklogPbis } from "@/hooks/use-backlog-pbis";
import { appToast } from "@/lib/toast";

export type BulkReassignParentTasksDialogProps = {
  readonly project: string;
  readonly ids: number[];
  readonly onCompleted: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
};

export function BulkReassignParentTasksDialog({
  project,
  ids,
  onCompleted,
  disabled,
  className,
}: BulkReassignParentTasksDialogProps) {
  const [open, setOpen] = useState(false);
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const count = ids.length;
  const canFetchBacklog = open && Boolean(project);

  // Cargamos el backlog completo del proyecto (mismo alcance que "Backlog
  // completo" en /time-log) solo cuando el diálogo está abierto, para no
  // penalizar el render inicial de la pantalla de tareas.
  const { pbis: backlogPbis, loading: backlogLoading } = useBacklogPbis(
    canFetchBacklog ? project : null,
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setNewParentId(null);
  }, []);

  async function handleConfirm() {
    if (!project || count === 0 || !newParentId) return;
    setSaving(true);
    try {
      const result = await bulkReassignWorkItemsParent({ project, ids, newParentId });

      if (!result.ok) {
        appToast.error(
          result.errorMessage ?? `No se pudo re-asignar ninguna de las ${count} tareas.`,
        );
        return;
      }

      showStatusSummary({
        expected: result.expected,
        processed: result.processed,
        failed: result.failed,
      });
      setOpen(false);
      setNewParentId(null);
      onCompleted();
    } catch {
      appToast.error(`No se pudo re-asignar ninguna de las ${count} tareas.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            type="button"
            disabled={disabled || count === 0}
            className={className}
          />
        }
      >
        <GitFork aria-hidden />
        Cambiar HU
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            Cambiar HU padre de {count === 1 ? "1 tarea" : `${count} tareas`}
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona la nueva HU padre en el backlog del proyecto.
            Las tareas se moverán una por una; si alguna falla, las demás se
            siguen procesando.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bulk-task-parent-hu">HU padre</Label>
          {canFetchBacklog && backlogLoading ? (
            <Skeleton id="bulk-task-parent-hu" className="h-9 w-full rounded-lg" />
          ) : (
            <PbiSelectComboboxField
              id="bulk-task-parent-hu"
              pbis={backlogPbis}
              value={newParentId !== null ? String(newParentId) : null}
              onValueChange={(value) => setNewParentId(value ? Number(value) : null)}
              disabled={saving || !project || backlogPbis.length === 0}
              placeholder={
                !project
                  ? "Selecciona un proyecto"
                  : backlogPbis.length === 0
                    ? "Sin HUs disponibles"
                    : "Selecciona una HU"
              }
              searchPlaceholder="Buscar por título o ID…"
              emptyMessage="Sin historias que coincidan."
            />
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || newParentId === null}
          >
            {saving ? "Actualizando…" : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}