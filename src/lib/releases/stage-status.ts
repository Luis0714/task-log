import type { ReleaseStage, ReleaseStageStatus } from "@/lib/releases/types";

export const RELEASE_STAGE_STATUS_LABEL: Record<ReleaseStageStatus, string> = {
  succeeded: "Listo",
  needs_approval: "Esperando aprobación",
  in_progress: "En curso",
  waiting: "Encolado",
  rejected: "Rechazado",
  canceled: "Cancelado",
};

export const RELEASE_STAGE_STATUS_TONE: Record<ReleaseStageStatus, string> = {
  succeeded:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  needs_approval:
    "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  in_progress: "border-sky-500/50 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  waiting: "border-border bg-muted/70 text-muted-foreground",
  rejected: "border-rose-500/45 bg-rose-500/10 text-rose-800 dark:text-rose-300",
  canceled: "border-border bg-muted/50 text-muted-foreground line-through",
};

export function releaseStageTooltip(stage: ReleaseStage): string {
  const status = RELEASE_STAGE_STATUS_LABEL[stage.status];
  if (stage.canApprove) {
    return `${stage.name}: ${status}. Clic para aprobar el despliegue.`;
  }
  return `${stage.name}: ${status}`;
}
