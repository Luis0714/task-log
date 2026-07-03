import { cn } from "@/lib/utils";

export type DeliveryMetricProgressTrackProps = {
  progress: number;
  barClassName: string;
};

export function DeliveryMetricProgressTrack({
  progress,
  barClassName,
}: DeliveryMetricProgressTrackProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-muted/80 h-1.5 w-full overflow-hidden rounded-full">
      <div
        className={cn("h-full rounded-full transition-all duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
