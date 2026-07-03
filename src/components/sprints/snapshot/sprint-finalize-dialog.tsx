"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { appToast } from "@/lib/toast";

export type SprintFinalizeDialogProps = {
  finalizing?: boolean;
  disabled?: boolean;
  buttonLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  onConfirm: () => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function SprintFinalizeDialog({
  finalizing = false,
  disabled = false,
  buttonLabel = "Finalizar sprint",
  dialogTitle = "Finalizar sprint",
  dialogDescription = "Se guardará una fotografía del objetivo y del estado final de cada historia. Podrás consultarla más adelante aunque las HUs cambien de sprint o de estado en Azure DevOps.",
  onConfirm,
}: SprintFinalizeDialogProps) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    const result = await onConfirm();
    if (result.ok) {
      appToast.success("Retrospectiva del sprint guardada.");
      setOpen(false);
      return;
    }
    appToast.error(result.message);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" disabled={disabled || finalizing}>
            {finalizing ? "Finalizando…" : buttonLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={finalizing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={finalizing}>
            {finalizing ? "Guardando…" : "Confirmar cierre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
