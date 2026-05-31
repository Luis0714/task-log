import { Badge } from "@/components/ui/badge";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import {
  formatSprintDateRange,
  getSprintTimeFrameLabel,
} from "@/lib/time-log/format-options";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

export type SelectedSprintSummaryProps = {
  sprint: AdoSprintDto;
};

export function SelectedSprintSummary({ sprint }: SelectedSprintSummaryProps) {
  const dateRange = formatSprintDateRange(sprint.startDate, sprint.finishDate);
  const timeFrameLabel = getSprintTimeFrameLabel(sprint.timeFrame);

  return (
    <DashboardSection
      title={sprint.name}
      description="Sprint seleccionado para el análisis."
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {timeFrameLabel ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant="secondary">{timeFrameLabel}</Badge>
            </dd>
          </div>
        ) : null}
        {dateRange ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground">Periodo</dt>
            <dd className="font-medium">{dateRange}</dd>
          </div>
        ) : null}
      </dl>
    </DashboardSection>
  );
}
