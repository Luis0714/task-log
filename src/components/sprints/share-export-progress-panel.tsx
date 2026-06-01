"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, ImageIcon, Loader2 } from "lucide-react";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type { ShareExportKind } from "@/lib/sprints/share-export-kind";
import { getShareExportLoadingMessage } from "@/lib/sprints/share-export-kind";
import { cn } from "@/lib/utils";

const EXPORT_KIND_CONFIG: Record<
  ShareExportKind,
  { Icon: LucideIcon; iconClassName: string; iconBgClassName: string }
> = {
  image: {
    Icon: ImageIcon,
    iconClassName: "text-primary",
    iconBgClassName: "bg-primary/10 ring-primary/20",
  },
  pdf: {
    Icon: FileText,
    iconClassName: "text-orange-600 dark:text-orange-400",
    iconBgClassName: "bg-orange-500/10 ring-orange-500/20",
  },
};

export type ShareExportProgressPanelProps = {
  kind: ShareExportKind;
  message?: string;
  progress: number;
};

export function ShareExportProgressPanel({
  kind,
  message,
  progress,
}: ShareExportProgressPanelProps) {
  const config = EXPORT_KIND_CONFIG[kind];
  const { Icon } = config;
  const label = message ?? getShareExportLoadingMessage(kind);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full ring-1",
              config.iconBgClassName,
            )}
          >
            <Icon className={cn("size-5", config.iconClassName)} aria-hidden />
          </div>
          <p className="text-foreground text-sm font-medium">{label}</p>
        </div>

        <Progress value={progress}>
          <ProgressLabel className="text-muted-foreground">Progreso</ProgressLabel>
          <ProgressValue />
        </Progress>

        <p className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
          Preparando vista previa…
        </p>
      </div>
    </div>
  );
}
