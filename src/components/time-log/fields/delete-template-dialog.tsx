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
import { appToast } from "@/lib/toast";

export type DeleteTemplateDialogProps = {
  templateName: string;
  onDelete: () => Promise<boolean> | boolean;
  children?: React.ReactNode;
};

export function DeleteTemplateDialog({
  templateName,
  onDelete,
  children,
}: Readonly<DeleteTemplateDialogProps>) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);
    if (ok) {
      appToast.success(`Plantilla "${templateName}" eliminada.`);
      setOpen(false);
    } else {
      appToast.error("No pudimos eliminar la plantilla.");
    }
  };

  const triggerButton = children ? (
    <button
      type="button"
      aria-label={`Eliminar ${templateName}`}
      className="text-muted-foreground hover:text-destructive rounded p-0.5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </button>
  ) : (
    <Button type="button" variant="destructive">
      <Trash2 aria-hidden />
      Eliminar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerButton} />
      <DialogContent showCloseButton={false} keepMounted>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta plantilla?</DialogTitle>
          <DialogDescription>
            La plantilla &quot;{templateName}&quot; se eliminará y no podrás
            recuperarla. Las tareas que ya creaste a partir de ella no se verán
            afectadas.
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
