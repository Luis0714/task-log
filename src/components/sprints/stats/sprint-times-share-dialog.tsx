"use client";

import { SprintTimesShareVariantControl } from "@/components/sprints/stats/sprint-times-share-variant-control";
import { ShareExportDialog } from "@/components/sprints/share-export-dialog";
import { ShareExportPreview } from "@/components/sprints/share-export-preview";
import type { UseSprintTimesShareResult } from "@/hooks/sprints/use-sprint-times-share";

// Textos del diálogo extraídos como constantes de módulo: facilita encontrar y
// ajustar el wording sin tener que buscar a través del JSX anidado, y evita
// divergencias entre la descripción y los alts de la imagen.
const DIALOG_DESCRIPTION =
  "La imagen refleja lo que estás viendo en la tabla. Puedes cambiar el resumen y compartirla en Teams, WhatsApp o correo, o copiarla al portapapeles.";
const PREVIEW_ALT = "Vista previa de tiempos del sprint";
const EMPTY_PREVIEW_MESSAGE =
  "Elige el resumen que quieres compartir para generar la imagen.";

export type SprintTimesShareDialogProps = {
  canShare: boolean;
  share: UseSprintTimesShareResult;
};

export function SprintTimesShareDialog({
  canShare,
  share,
}: Readonly<SprintTimesShareDialogProps>) {
  const hasPreview = Boolean(share.previewUrl) && !share.loading && !share.error;

  return (
    <ShareExportDialog
      canShare={canShare}
      open={share.open}
      onOpenChange={share.setOpen}
      title={`Compartir tiempos del ${share.sprintName}`}
      description={DIALOG_DESCRIPTION}
      selector={
        <SprintTimesShareVariantControl
          variant={share.variant}
          times={share.times}
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
          imageAlt={PREVIEW_ALT}
          pdfTitle={PREVIEW_ALT}
          emptyState={EMPTY_PREVIEW_MESSAGE}
        />
      }
      downloadLabel="Descargar imagen"
      showCopyImage
      canCopyImage={share.canCopyImage}
      hasPreview={hasPreview}
      onDownload={share.download}
      onShare={share.share}
      onCopyImage={share.copyImage}
    />
  );
}
