import { cn } from "@/lib/utils";

function formatEffortLabel(effort: number): string {
  if (Number.isInteger(effort)) return String(effort);
  return effort.toFixed(1).replace(/\.0$/, "");
}

export type WorkItemEffortBadgeProps = {
  effort: number;
  className?: string;
};

export function WorkItemEffortBadge({ effort, className }: WorkItemEffortBadgeProps) {
  if (!Number.isFinite(effort) || effort < 0) return null;

  const label = formatEffortLabel(effort);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-800 tabular-nums dark:text-violet-300",
        className,
      )}
      title={`Esfuerzo: ${label}`}
    >
      {label}
    </span>
  );
}
