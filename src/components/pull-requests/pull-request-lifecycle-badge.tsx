import { StatusDotBadge } from "@/components/shared/status-dot-badge";
import type { PullRequestLifecycleStatus } from "@/lib/pull-requests/types";
import { cn } from "@/lib/utils";

const LIFECYCLE_TONES: Record<
  PullRequestLifecycleStatus,
  { label: string; className: string; dotClassName: string }
> = {
  active: {
    label: "Activo",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    dotClassName: "bg-sky-500",
  },
  completed: {
    label: "Completado",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  abandoned: {
    label: "Abandonado",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
};

export type PullRequestLifecycleBadgeProps = {
  status: PullRequestLifecycleStatus;
  className?: string;
};

export function PullRequestLifecycleBadge({
  status,
  className,
}: PullRequestLifecycleBadgeProps) {
  const tone = LIFECYCLE_TONES[status];
  return (
    <StatusDotBadge
      label={tone.label}
      className={cn(tone.className, className)}
      dotClassName={tone.dotClassName}
    />
  );
}
