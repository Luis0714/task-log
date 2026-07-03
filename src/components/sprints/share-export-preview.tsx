"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ShareExportProgressPanel } from "@/components/sprints/share-export-progress-panel";
import type { ShareExportKind } from "@/lib/sprints/share-export-kind";
import { getShareExportLoadingMessage } from "@/lib/sprints/share-export-kind";
import { cn } from "@/lib/utils";

export type ShareExportPreviewProps = {
  kind: ShareExportKind;
  loading: boolean;
  progress: number;
  error: string | null;
  previewUrl: string | null;
  loadingMessage?: string;
  imageAlt: string;
  pdfTitle: string;
  /** Mensaje centrado mientras no hay preview y no se está cargando. */
  emptyState?: ReactNode;
};

const PDF_PREVIEW_MIN_HEIGHT_CLASS = "min-h-[min(60vh,520px)]";

export function ShareExportPreview({
  kind,
  loading,
  progress,
  error,
  previewUrl,
  loadingMessage,
  imageAlt,
  pdfTitle,
  emptyState,
}: ShareExportPreviewProps) {
  if (loading) {
    return (
      <ShareExportProgressPanel
        kind={kind}
        message={loadingMessage ?? getShareExportLoadingMessage(kind)}
        progress={progress}
      />
    );
  }

  if (error) {
    return <CopilotErrorAlert message={error} />;
  }

  if (!previewUrl) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <p className="text-muted-foreground max-w-sm text-sm">
          {emptyState ?? "No hay vista previa disponible."}
        </p>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <iframe
          src={previewUrl}
          title={pdfTitle}
          className={cn(PDF_PREVIEW_MIN_HEIGHT_CLASS, "w-full flex-1 rounded-md border-0 bg-white")}
        />
        <p className="text-muted-foreground shrink-0 text-center text-xs">
          Usa «Descargar PDF» abajo para guardar con el nombre del sprint. El botón del visor
          puede generar un nombre aleatorio.
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob preview from generated PNG
    <img src={previewUrl} alt={imageAlt} className="w-full object-contain" />
  );
}
