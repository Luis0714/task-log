"use client";

import { SprintGoalShareFormatControl } from "@/components/sprints/goal/sprint-goal-share-format-control";
import { ShareExportDialog } from "@/components/sprints/share-export-dialog";
import { ShareExportPreview } from "@/components/sprints/share-export-preview";
import type { UseSprintGoalShareResult } from "@/hooks/sprints/use-sprint-goal-share";

export type SprintGoalShareDialogProps = {
  canShare: boolean;
  share: UseSprintGoalShareResult;
};

export function SprintGoalShareDialog({ canShare, share }: SprintGoalShareDialogProps) {
  const hasPreview = Boolean(share.previewUrl) && !share.loading && !share.error;
  const isImage = share.format === "image";

  return (
    <ShareExportDialog
      canShare={canShare}
      open={share.open}
      onOpenChange={share.setOpen}
      title="Compartir objetivo del sprint"
      description={
        <>
          Exporta el objetivo general y las historias comprometidas como imagen o PDF.
          {isImage
            ? " También puedes copiar la imagen al portapapeles para pegarla en Teams o chat."
            : " El PDF es ideal para imprimir o adjuntar en correo."}
        </>
      }
      selector={
        <SprintGoalShareFormatControl
          format={share.format}
          disabled={share.loading}
          onFormatChange={share.setFormat}
        />
      }
      loading={share.loading}
      preview={
        <ShareExportPreview
          kind={isImage ? "image" : "pdf"}
          loading={share.loading}
          progress={share.progress}
          error={share.error}
          previewUrl={share.previewUrl}
          imageAlt="Vista previa del objetivo del sprint"
          pdfTitle="Vista previa del PDF del objetivo del sprint"
        />
      }
      downloadLabel={isImage ? "Descargar imagen" : "Descargar PDF"}
      showCopyImage={isImage}
      canCopyImage={share.canCopyImage}
      canShareNative={share.canShareNative}
      hasPreview={hasPreview}
      onDownload={share.download}
      onShare={share.share}
      onCopyImage={share.copyImage}
    />
  );
}
