"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import { appToast } from "@/lib/toast";

export type AssignmentDeleteDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  assignment: AssignmentDto;
  onConfirm: () => Promise<boolean>;
};

export function AssignmentDeleteDialog({
  open,
  onOpenChange,
  assignment,
  onConfirm,
}: AssignmentDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const ok = await onConfirm();
    setDeleting(false);
    if (ok) {
      appToast.success("Asignación eliminada.");
      onOpenChange(false);
    } else {
      appToast.error("No se pudo eliminar la asignación.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar esta asignación?</DialogTitle>
          <DialogDescription>
            Se eliminará de forma permanente la asignación de{" "}
            {assignment.personDisplayName} en {assignment.projectName}
            {assignment.teamName ? ` · ${assignment.teamName}` : ""}. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={deleting} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onDelete()}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
