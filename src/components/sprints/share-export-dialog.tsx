"use client";

import type { ReactNode } from "react";
import { Share2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

export type ShareExportDialogProps = {
  canShare: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  selector: ReactNode;
  loading: boolean;
  preview: ReactNode;
  downloadLabel: string;
  showCopyImage: boolean;
  canCopyImage: boolean;
  canShareNative: boolean;
  hasPreview: boolean;
  onDownload: () => void;
  onShare: () => void;
  onCopyImage?: () => void;
};

export function ShareExportDialog({
  canShare,
  open,
  onOpenChange,
  title,
  description,
  selector,
  loading,
  preview,
  downloadLabel,
  showCopyImage,
  canCopyImage,
  canShareNative,
  hasPreview,
  onDownload,
  onShare,
  onCopyImage,
}: ShareExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" disabled={!canShare}>
            <Share2 className="size-4" aria-hidden />
            Compartir
          </Button>
        }
      />
      <DialogContent
        className={cn(
          "flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl",
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none",
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="shrink-0">{selector}</div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col rounded-lg border bg-muted/20 p-4",
            loading ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {preview}
        </div>

        <DialogFooter showCloseButton={false} className="shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {showCopyImage && canCopyImage ? (
            <Button
              variant="outline"
              onClick={() => onCopyImage?.()}
              disabled={!hasPreview}
            >
              Copiar imagen
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => void onDownload()} disabled={!hasPreview}>
            {downloadLabel}
          </Button>
          <Button onClick={() => void onShare()} disabled={!hasPreview}>
            {canShareNative ? "Compartir" : "Descargar y compartir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
