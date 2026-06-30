"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkReassignWorkItemsParent } from "@/components/tasks/task-bulk.service";
import { showStatusSummary } from "@/components/tasks/bulk-change-status-tasks-dialog";
import { appToast } from "@/lib/toast";
import type { ParentHuOption } from "@/components/tasks/task-detail-sheet";

export type BulkReassignParentTasksDialogProps = {
  project: string;
  ids: number[];
  parentHuOptions: readonly ParentHuOption[];
  onCompleted: () => void;
  disabled?: boolean;
  className?: string;
};

export function BulkReassignParentTasksDialog({
  project,
  ids,
  parentHuOptions,
  onCompleted,
  disabled,
  className,
}: BulkReassignParentTasksDialogProps) {
  const [open, setOpen] = useState(false);
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const count = ids.length;

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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setNewParentId(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            type="button"
            disabled={disabled || count === 0 || parentHuOptions.length === 0}
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
            Selecciona la nueva HU padre. Las tareas se moverán una por una; si alguna falla,
            las demás se siguen procesando.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bulk-task-parent-hu">HU padre</Label>
          <Select
            value={newParentId !== null ? String(newParentId) : undefined}
            onValueChange={(v) => setNewParentId(v ? Number(v) : null)}
            disabled={saving || parentHuOptions.length === 0}
          >
            <SelectTrigger id="bulk-task-parent-hu" className="w-full">
              <SelectValue
                placeholder={
                  parentHuOptions.length === 0
                    ? "Sin HUs disponibles"
                    : "Selecciona una HU"
                }
              >
                {newParentId !== null
                  ? (parentHuOptions.find((o) => o.id === newParentId)?.title ?? `HU #${newParentId}`)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {parentHuOptions.map((hu) => (
                <SelectItem key={hu.id} value={String(hu.id)}>
                  #{hu.id} {hu.title}
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
            disabled={saving || newParentId === null}
          >
            {saving ? "Actualizando…" : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
