import { Bug } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkItemBugCountBadgeVariant = "total" | "attended";

export type WorkItemBugCountBadgeProps = {
  count: number;
  variant?: WorkItemBugCountBadgeVariant;
  className?: string;
};

const VARIANT_STYLES: Record<WorkItemBugCountBadgeVariant, string> = {
  total: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
  attended: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
};

function formatTitle(count: number, variant: WorkItemBugCountBadgeVariant): string {
  const label = count === 1 ? "bug" : "bugs";
  if (variant === "attended") {
    return `${count} ${label} atendido${count === 1 ? "" : "s"}`;
  }
  return `${count} ${label} vinculado${count === 1 ? "" : "s"}`;
}

export function WorkItemBugCountBadge({
  count,
  variant = "total",
  className,
}: WorkItemBugCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        VARIANT_STYLES[variant],
        className,
      )}
      title={formatTitle(count, variant)}
    >
      <Bug className="size-3" aria-hidden />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
