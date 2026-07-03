"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { bulkUpdateWorkItemsState } from "@/components/tasks/task-bulk.service";
import { appToast } from "@/lib/toast";

export type BulkChangeStatusTasksDialogProps = {
  project: string;
  ids: number[];
  stateNames: readonly string[];
  workingDate?: string;
  onCompleted: () => void;
  disabled?: boolean;
  className?: string;
};

export function BulkChangeStatusTasksDialog({
  project,
  ids,
  stateNames,
  workingDate,
  onCompleted,
  disabled,
  className,
}: BulkChangeStatusTasksDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);

  const count = ids.length;

  async function handleConfirm() {
    if (!project || count === 0 || !state) return;
    setSaving(true);
    try {
      const result = await bulkUpdateWorkItemsState({
        project,
        ids,
        state,
        workingDate,
      });

      if (!result.ok) {
        appToast.error(
          result.errorMessage ??
            `No se pudo cambiar el estado de ninguna de las ${count} tareas.`,
        );
        return;
      }

      const { expected, processed, failed } = result;
      showStatusSummary({ expected, processed, failed });
      setOpen(false);
      setState("");
      onCompleted();
    } catch {
      appToast.error(
        `No se pudo cambiar el estado de ninguna de las ${count} tareas.`,
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setState("");
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
        <ArrowRightLeft aria-hidden />
        Cambiar estado
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            Cambiar estado de {count === 1 ? "1 tarea" : `${count} tareas`}
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado. Las tareas se actualizarán una por una;
            si alguna falla, las demás se siguen procesando.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bulk-task-state">Estado</Label>
          <Select
            value={state}
            onValueChange={(value) => setState(value ?? "")}
            disabled={saving || stateNames.length === 0}
          >
            <SelectTrigger id="bulk-task-state" className="w-full">
              <SelectValue
                placeholder={
                  stateNames.length === 0
                    ? "Estados no disponibles"
                    : "Selecciona un estado"
                }
              >
                {state ? <WorkItemStateLabel state={state} /> : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stateNames.map((name) => (
                <SelectItem key={name} value={name}>
                  <WorkItemStateLabel state={name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || !state}
          >
            {saving ? "Actualizando…" : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Un único toast con el resumen (esperadas vs actualizadas) según el resultado.
 * Si todas se actualizaron → success; si sólo algunas → warning; si ninguna → error.
 */
export function showStatusSummary({
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
        ? "Estado actualizado."
        : `${expected} tareas actualizadas.`,
    );
    return;
  }

  if (processed === 0) {
    appToast.error(
      expected === 1
        ? "No se pudo actualizar el estado."
        : `No se pudo actualizar el estado de ninguna de las ${expected} tareas.`,
    );
    return;
  }

  appToast.warning(
    expected === 1
      ? "No se pudo actualizar el estado."
      : `Se actualizaron ${processed} de ${expected} tareas. ${failedCount} fallaron.`,
  );
}
