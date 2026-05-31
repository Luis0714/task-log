"use client";

import { Share2 } from "lucide-react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
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
import type { UseSprintGoalShareResult } from "@/hooks/sprints/use-sprint-goal-share";
import { appToast } from "@/lib/toast";

export type SprintGoalShareDialogProps = {
  canShare: boolean;
  share: UseSprintGoalShareResult;
};

export function SprintGoalShareDialog({ canShare, share }: SprintGoalShareDialogProps) {
  async function handleDownload() {
    try {
      await share.downloadImage();
    } catch (cause) {
      appToast.error(
        cause instanceof Error
          ? cause.message
          : "No se pudo descargar la imagen.",
      );
    }
  }

  async function handleShare() {
    try {
      await share.shareImage();
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      appToast.error(
        cause instanceof Error
          ? cause.message
          : "No se pudo compartir la imagen.",
      );
    }
  }

  return (
    <Dialog open={share.open} onOpenChange={share.setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canShare}
          >
            <Share2 className="size-4" aria-hidden />
            Compartir
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compartir objetivo del sprint</DialogTitle>
          <DialogDescription>
            Imagen resumen con el objetivo general y las historias comprometidas.
            Descárgala o compártela en Teams, WhatsApp o correo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-4">
          {share.loading ? (
            <p className="text-muted-foreground text-sm">Generando imagen…</p>
          ) : share.error ? (
            <CopilotErrorAlert message={share.error} />
          ) : share.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview from generated PNG
            <img
              src={share.previewUrl}
              alt="Vista previa del objetivo del sprint"
              className="max-h-[420px] w-full object-contain"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay vista previa disponible.
            </p>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => share.setOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={share.loading || Boolean(share.error) || !share.previewUrl}
          >
            Descargar imagen
          </Button>
          <Button
            onClick={handleShare}
            disabled={share.loading || Boolean(share.error) || !share.previewUrl}
          >
            {share.canShareNative ? "Compartir" : "Descargar y compartir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
