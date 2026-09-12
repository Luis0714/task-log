import { CheckCircle2, CircleAlert, Clock } from "lucide-react";

import type { PullRequestDetailCheck } from "@/lib/pull-requests/detail-types";
import { cn } from "@/lib/utils";

const CHECK_ICON = {
  succeeded: CheckCircle2,
  failed: CircleAlert,
  pending: Clock,
} as const;

const CHECK_ICON_CLASS = {
  succeeded: "text-emerald-600 dark:text-emerald-400",
  failed: "text-destructive",
  pending: "text-muted-foreground",
} as const;

export type PullRequestCheckItemProps = Readonly<{
  check: PullRequestDetailCheck;
}>;

export function PullRequestCheckItem({ check }: PullRequestCheckItemProps) {
  const Icon = CHECK_ICON[check.state];
  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", CHECK_ICON_CLASS[check.state])}
        aria-hidden
      />
      <span className="min-w-0 text-sm">{check.label}</span>
    </li>
  );
}
