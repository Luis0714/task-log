import { isSameLocalDay, parseLocalDateKey } from "@/lib/dashboard/sprint-days";
import { cn } from "@/lib/utils";

function formatTaskDateLabel(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) return dateKey;

  if (isSameLocalDay(date, new Date())) return "Hoy";

  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getTaskDateClassName(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) return "border-border text-muted-foreground";

  if (isSameLocalDay(date, new Date())) {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart < today) {
    return "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300";
  }

  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300";
}

export type TaskDateBadgeProps = {
  dateKey: string;
  className?: string;
};

export function TaskDateBadge({ dateKey, className }: TaskDateBadgeProps) {
  const label = formatTaskDateLabel(dateKey);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        getTaskDateClassName(dateKey),
        className,
      )}
      title={dateKey}
    >
      {label}
    </span>
  );
}
