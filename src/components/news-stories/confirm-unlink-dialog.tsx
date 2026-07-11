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
import type { ProjectTeamNewsStory } from "@/lib/db";

export type ConfirmUnlinkDialogProps = Readonly<{
  story: ProjectTeamNewsStory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}>;

export function ConfirmUnlinkDialog({
  story,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmUnlinkDialogProps) {
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
          <DialogTitle>Desvincular HU</DialogTitle>
          <DialogDescription>
            #{story.workItemId} ·{" "}
            {story.workItemTitleSnapshot ?? "(sin título guardado)"}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          La HU dejará de contar como novedad en este (Proyecto, Equipo). Podrás
          volver a vincularla después.
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
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Desvincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}