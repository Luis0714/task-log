"use client";

import { SprintTimesShareVariantControl } from "@/components/sprints/stats/sprint-times-share-variant-control";
import { ShareExportDialog } from "@/components/sprints/share-export-dialog";
import { ShareExportPreview } from "@/components/sprints/share-export-preview";
import type { UseSprintTimesShareResult } from "@/hooks/sprints/use-sprint-times-share";

export type SprintTimesShareDialogProps = {
  canShare: boolean;
  share: UseSprintTimesShareResult;
};

export function SprintTimesShareDialog({ canShare, share }: SprintTimesShareDialogProps) {
  const hasPreview = Boolean(share.previewUrl) && !share.loading && !share.error;

  return (
    <ShareExportDialog
      canShare={canShare}
      open={share.open}
      onOpenChange={share.setOpen}
      title="Compartir tiempos del sprint"
      description="Elige el resumen que necesitas y compártelo como imagen en Teams, WhatsApp o correo. También puedes copiar la imagen al portapapeles."
      selector={
        <SprintTimesShareVariantControl
          variant={share.variant}
          disabled={share.loading}
          isVariantEnabled={share.isVariantEnabled}
          onVariantChange={share.setVariant}
        />
      }
      loading={share.loading}
      preview={
        <ShareExportPreview
          kind="image"
          loading={share.loading}
          progress={share.progress}
          error={share.error}
          previewUrl={share.previewUrl}
          imageAlt="Vista previa de tiempos del sprint"
          pdfTitle="Vista previa de tiempos del sprint"
        />
      }
      downloadLabel="Descargar imagen"
      showCopyImage
      canCopyImage={share.canCopyImage}
      canShareNative={share.canShareNative}
      hasPreview={hasPreview}
      onDownload={share.download}
      onShare={share.share}
      onCopyImage={share.copyImage}
    />
  );
}
