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
import type { AdoUserStoryHit } from "@/services/news-stories/news-stories.service";

export type ConfirmLinkDialogProps = Readonly<{
  hit: AdoUserStoryHit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}>;

export function ConfirmLinkDialog({
  hit,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmLinkDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const ok = await onConfirm();
      if (ok) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular HU de novedad</DialogTitle>
          <DialogDescription>
            #{hit.id} · {hit.title}
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Esta HU será reconocida como novedad dentro del (Proyecto, Equipo)
          actualmente seleccionado.
        </p>
        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              />
            }
          >
            Cancelar
          </DialogClose>
          <Button type="button" disabled={submitting} onClick={handleConfirm}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}