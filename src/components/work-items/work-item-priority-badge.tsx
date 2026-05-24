import { cn } from "@/lib/utils";

function formatPriorityLabel(priority: number | string): string {
  if (typeof priority === "string") return priority;

  switch (priority) {
    case 1:
      return "Crítica";
    case 2:
      return "Alta";
    case 3:
      return "Media";
    case 4:
      return "Baja";
    default:
      return `P${priority}`;
  }
}

function getPriorityClassName(priority: number | string): string {
  if (typeof priority === "string") {
    const normalized = priority.trim().toLowerCase();
    if (["critical", "crítica", "critica", "1"].includes(normalized)) {
      return "border-destructive/25 bg-destructive/10 text-destructive";
    }
    if (["high", "alta", "2"].includes(normalized)) {
      return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    }
    return "border-border text-muted-foreground";
  }

  if (priority === 1) return "border-destructive/25 bg-destructive/10 text-destructive";
  if (priority === 2) return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  if (priority === 3) return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300";
  return "border-border text-muted-foreground";
}

export type WorkItemPriorityBadgeProps = {
  priority: number | string;
  className?: string;
};

export function WorkItemPriorityBadge({ priority, className }: WorkItemPriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        getPriorityClassName(priority),
        className,
      )}
    >
      {formatPriorityLabel(priority)}
    </span>
  );
}
