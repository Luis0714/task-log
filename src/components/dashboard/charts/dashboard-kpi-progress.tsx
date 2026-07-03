import { cn } from "@/lib/utils";

export type DashboardKpiProgressProps = {
  value: number;
  barClassName: string;
  heightClassName: string;
  marginClassName: string;
};

export function DashboardKpiProgress({
  value,
  barClassName,
  heightClassName,
  marginClassName,
}: DashboardKpiProgressProps) {
  return (
    <div
      className={cn(
        "bg-muted/80 w-full overflow-hidden rounded-full",
        heightClassName,
        marginClassName,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", barClassName)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
