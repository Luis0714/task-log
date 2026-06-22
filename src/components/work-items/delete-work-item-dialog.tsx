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
import { deleteWorkItemById } from "@/components/tasks/task-work-item.service";
import { appToast } from "@/lib/toast";

export type DeleteWorkItemDialogProps = {
  workItemId: number;
  project: string;
  itemLabel: string;
  onDeleted: () => void;
  disabled?: boolean;
  className?: string;
};

export function DeleteWorkItemDialog({
  workItemId,
  project,
  itemLabel,
  onDeleted,
  disabled,
  className,
}: DeleteWorkItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteWorkItemById(workItemId, project);
      if (!result.ok) {
        appToast.error(result.errorMessage ?? "No se pudo eliminar.");
        return;
      }
      appToast.success(`${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} eliminado.`);
      setOpen(false);
      onDeleted();
    } catch {
      appToast.error("No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" type="button" disabled={disabled} className={className} />
        }
      >
        <Trash2 aria-hidden />
        Eliminar
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Eliminar este {itemLabel}?</DialogTitle>
          <DialogDescription>
            El elemento #{workItemId} se moverá a la Papelera de reciclaje en Azure DevOps. Podrás restaurarlo desde allí si lo necesitas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={deleting} />}
          >
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
