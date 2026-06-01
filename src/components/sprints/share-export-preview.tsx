"use client";

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
      <p className="text-muted-foreground text-sm">No hay vista previa disponible.</p>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={previewUrl}
        title={pdfTitle}
        className={cn(PDF_PREVIEW_MIN_HEIGHT_CLASS, "w-full rounded-md border-0 bg-white")}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob preview from generated PNG
    <img src={previewUrl} alt={imageAlt} className="w-full object-contain" />
  );
}
