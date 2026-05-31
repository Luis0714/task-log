import { Badge } from "@/components/ui/badge";
import {
  formatSprintDateRange,
  getSprintTimeFrameLabel,
} from "@/lib/time-log/format-options";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

export type SelectedSprintMetaProps = {
  sprint: AdoSprintDto;
};

export function SelectedSprintMeta({ sprint }: SelectedSprintMetaProps) {
  const dateRange = formatSprintDateRange(sprint.startDate, sprint.finishDate);
  const timeFrameLabel = getSprintTimeFrameLabel(sprint.timeFrame);

  if (!timeFrameLabel && !dateRange) {
    return (
      <p className="text-sm font-medium">{sprint.name}</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="font-medium">{sprint.name}</span>
      {timeFrameLabel ? (
        <Badge variant="secondary">{timeFrameLabel}</Badge>
      ) : null}
      {dateRange ? (
        <>
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <span className="text-muted-foreground">{dateRange}</span>
        </>
      ) : null}
    </div>
  );
}
