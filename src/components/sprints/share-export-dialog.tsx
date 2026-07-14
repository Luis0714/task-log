"use client";

import type { ReactNode } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <DialogClose
            render={<Button type="button" variant="outline" />}
          >
            Cerrar
          </DialogClose>
          {showCopyImage && canCopyImage ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onCopyImage?.()}
                    disabled={!hasPreview}
                    aria-label="Copiar imagen"
                  >
                    <Copy className="size-4" aria-hidden />
                  </Button>
                }
              />
              <TooltipContent>Copiar imagen</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onDownload}
                  disabled={!hasPreview}
                  aria-label={downloadLabel}
                >
                  <Download className="size-4" aria-hidden />
                </Button>
              }
            />
            <TooltipContent>{downloadLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon"
                  onClick={onShare}
                  disabled={!hasPreview}
                  aria-label="Compartir"
                >
                  <Share2 className="size-4" aria-hidden />
                </Button>
              }
            />
            <TooltipContent>Compartir</TooltipContent>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
