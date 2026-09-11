import type { PullRequestVoteStatus } from "@/lib/pull-requests/types";

export type PullRequestStatusTone = {
  label: string;
  className: string;
  dotClassName: string;
};

export const PULL_REQUEST_STATUS_TONES: Record<
  PullRequestVoteStatus,
  PullRequestStatusTone
> = {
  needs_review: {
    label: "Requiere revisión",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  approved: {
    label: "Aprobado",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  changes_requested: {
    label: "Cambios pedidos",
    className:
      "border-destructive/40 bg-destructive/10 text-destructive",
    dotClassName: "bg-destructive",
  },
  waiting: {
    label: "Esperando",
    className: "border-border bg-muted/60 text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  draft: {
    label: "Borrador",
    className: "border-border bg-background text-muted-foreground",
    dotClassName: "bg-muted-foreground/70",
  },
};
