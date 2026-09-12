import { formatRelativeTime } from "@/lib/shared/format-relative-time";
import { cn } from "@/lib/utils";

export type RelativeTimeLabelProps = {
  isoDate: string;
  className?: string;
};

export function RelativeTimeLabel({ isoDate, className }: RelativeTimeLabelProps) {
  return (
    <time
      dateTime={isoDate}
      className={cn("text-muted-foreground shrink-0 text-[11px]", className)}
    >
      {formatRelativeTime(isoDate)}
    </time>
  );
}
