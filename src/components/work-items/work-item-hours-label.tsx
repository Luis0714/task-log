import { formatHours } from "@/lib/dashboard/format-hours";
import { cn } from "@/lib/utils";

export type WorkItemHoursLabelProps = {
  hours: number;
  unit?: string;
  suffix?: string;
  className?: string;
};

export function WorkItemHoursLabel({
  hours,
  unit = "h",
  suffix = "registradas",
  className,
}: WorkItemHoursLabelProps) {
  return (
    <span className={cn("text-muted-foreground text-sm tabular-nums", className)}>
      <span className="text-foreground font-medium">{formatHours(hours, unit)}</span>
      {suffix ? ` ${suffix}` : null}
    </span>
  );
}
