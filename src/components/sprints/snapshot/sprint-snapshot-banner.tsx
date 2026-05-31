"use client";

import { AlertCircle, History } from "lucide-react";

import { SprintFinalizeDialog } from "@/components/sprints/snapshot/sprint-finalize-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  formatSnapshotFinalizedAt,
  formatSnapshotSourceLabel,
} from "@/lib/sprints/sprint-snapshot-display";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { cn } from "@/lib/utils";

export type SprintSnapshotBannerProps = {
  snapshot: SprintSnapshotData | null;
  isPastSprint: boolean;
  loading?: boolean;
  finalizing?: boolean;
  canFinalize?: boolean;
  onFinalize: () => Promise<{ ok: true } | { ok: false; message: string }>;
  className?: string;
};

export function SprintSnapshotBanner({
  snapshot,
  isPastSprint,
  loading = false,
  finalizing = false,
  canFinalize = false,
  onFinalize,
  className,
}: SprintSnapshotBannerProps) {
  if (loading) return null;

  if (snapshot) {
    const finalizedLabel = formatSnapshotFinalizedAt(snapshot.finalizedAt);
    const actor = snapshot.finalizedByDisplayName?.trim();
    const sourceLabel = formatSnapshotSourceLabel(snapshot.source);

    return (
      <Alert className={cn("border-primary/20 bg-primary/5", className)}>
        <History aria-hidden />
        <AlertTitle>Retrospectiva cerrada</AlertTitle>
        <AlertDescription>
          <p>
            {finalizedLabel ? `Cerrada el ${finalizedLabel}` : "Retrospectiva guardada"}
            {actor ? ` por ${actor}` : ""}
            {snapshot.version > 1 ? ` · versión ${snapshot.version}` : ""}
            {" · "}
            {sourceLabel}
          </p>
          <p className="mt-1">
            Estás viendo el resultado congelado del sprint. Los cambios actuales en Azure DevOps
            no alteran esta vista.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isPastSprint) return null;

  return (
    <Alert className={cn("border-amber-500/30 bg-amber-500/5", className)}>
      <AlertCircle aria-hidden className="text-amber-600 dark:text-amber-400" />
      <AlertTitle>Sprint terminado sin retrospectiva</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Este sprint ya finalizó, pero aún no se guardó su cierre. Los datos en vivo pueden no
          reflejar cómo os fue realmente en la review.
        </p>
        <SprintFinalizeDialog
          finalizing={finalizing}
          disabled={!canFinalize}
          onConfirm={onFinalize}
        />
      </AlertDescription>
    </Alert>
  );
}
