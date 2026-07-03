"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

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
import { bulkDeleteWorkItems } from "@/components/tasks/task-bulk.service";
import { appToast } from "@/lib/toast";

export type BulkDeleteTasksDialogProps = {
  project: string;
  ids: number[];
  onCompleted: () => void;
  disabled?: boolean;
  className?: string;
};

export function BulkDeleteTasksDialog({
  project,
  ids,
  onCompleted,
  disabled,
  className,
}: BulkDeleteTasksDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const count = ids.length;

  async function handleConfirm() {
    if (!project || count === 0) return;
    setDeleting(true);
    try {
      const result = await bulkDeleteWorkItems({ project, ids });

      if (!result.ok) {
        appToast.error(
          result.errorMessage ?? `No se pudo eliminar ninguna de las ${count} tareas.`,
        );
        return;
      }

      const { expected, processed, failed } = result;
      showDeleteSummary({ expected, processed, failed });
      setOpen(false);
      onCompleted();
    } catch {
      appToast.error(`No se pudo eliminar ninguna de las ${count} tareas.`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            type="button"
            disabled={disabled || count === 0}
            className={className}
          />
        }
      >
        <Trash2 aria-hidden />
        Eliminar
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            ¿Eliminar {count === 1 ? "esta tarea" : `estas ${count} tareas`}?
          </DialogTitle>
          <DialogDescription>
            {count === 1
              ? "La tarea se moverá a la Papelera de reciclaje en Azure DevOps. Podrás restaurarla desde allí si lo necesitas."
              : `Las ${count} tareas se moverán a la Papelera de reciclaje en Azure DevOps. Podrás restaurarlas desde allí si lo necesitas.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={deleting} />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Muestra un único toast con el resumen (esperadas vs eliminadas) según el
 * resultado. Si todas se eliminaron → success; si sólo algunas → warning;
 * si ninguna → error.
 */
export function showDeleteSummary({
  expected,
  processed,
  failed,
}: {
  expected: number;
  processed: number;
  failed: number[];
}) {
  const failedCount = failed.length;
  if (processed === expected) {
    appToast.success(
      expected === 1
        ? "Tarea eliminada."
        : `${expected} tareas eliminadas.`,
    );
    return;
  }

  if (processed === 0) {
    appToast.error(
      expected === 1
        ? "No se pudo eliminar la tarea."
        : `No se pudo eliminar ninguna de las ${expected} tareas.`,
    );
    return;
  }

  appToast.warning(
    expected === 1
      ? "No se pudo eliminar la tarea."
      : `Se eliminaron ${processed} de ${expected} tareas. ${failedCount} fallaron.`,
  );
}
