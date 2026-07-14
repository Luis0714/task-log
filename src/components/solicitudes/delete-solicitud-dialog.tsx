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
import { deleteSolicitud } from "@/services/solicitudes/solicitudes.service";
import { appToast } from "@/lib/toast";

export type DeleteSolicitudDialogProps = Readonly<{
  workItemId: number;
  project: string;
  itemTitle: string;
  onDeleted: () => void;
  disabled?: boolean;
  className?: string;
}>;

/**
 * Confirmación de borrado de una solicitud. Misma UX que
 * `DeleteWorkItemDialog`: la eliminación mueve el work item a la papelera
 * de Azure DevOps (DELETE sigue dejando rastro recuperable allí).
 */
export function DeleteSolicitudDialog({
  workItemId,
  project,
  itemTitle,
  onDeleted,
  disabled,
  className,
}: DeleteSolicitudDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSolicitud(workItemId, project);
      appToast.success("Solicitud eliminada", {
        description: `La novedad #${workItemId} se movió a la Papelera de Azure DevOps.`,
      });
      setOpen(false);
      onDeleted();
    } catch (cause) {
      appToast.error("No se pudo eliminar la solicitud", {
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            type="button"
            disabled={disabled}
            className={className}
            aria-label={`Eliminar solicitud #${workItemId}`}
          />
        }
      >
        <Trash2 aria-hidden className="text-destructive" />
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta solicitud?</DialogTitle>
          <DialogDescription>
            {itemTitle ? `${itemTitle} (#${workItemId}) ` : `La solicitud #${workItemId} `}
            se moverá a la Papelera de reciclaje en Azure DevOps. Podrás restaurarla desde allí si lo necesitas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={deleting} />}>
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
