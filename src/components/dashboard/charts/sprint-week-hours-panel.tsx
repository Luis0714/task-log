"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { SprintWeekHoursCard } from "@/components/dashboard/charts/sprint-week-hours-card";
import { weekContainsDay } from "@/lib/dashboard/sprint-weeks";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintWeekHoursPanelProps = {
  weeks: SprintWeekMetrics[];
  selectedDayKey?: string;
  loading?: boolean;
  className?: string;
};

export function SprintWeekHoursPanel({
  weeks,
  selectedDayKey = "",
  loading = false,
  className,
}: Readonly<SprintWeekHoursPanelProps>) {
  const displayWeeks =
    loading && weeks.length === 0
      ? [
          {
            label: "1ª semana",
            hours: { taskHours: 0, bugHours: 0, newsHours: 0 },
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
            dayKeys: [],
          },
          {
            label: "2ª semana",
            hours: { taskHours: 0, bugHours: 0, newsHours: 0 },
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
            dayKeys: [],
          },
        ]
      : weeks;

  if (!loading && displayWeeks.length === 0) return null;

  return (
    <ChartPanel
      title="Horas por semana"
      size="compact"
      loading={loading}
      className={className}
      highlight={displayWeeks.some((w) => weekContainsDay(w, selectedDayKey))}
    >
      <div
        className={cn(
          "grid gap-2",
          displayWeeks.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {displayWeeks.map((week) => (
          <SprintWeekHoursCard
            key={week.label}
            week={week}
            active={Boolean(selectedDayKey && weekContainsDay(week, selectedDayKey))}
            loading={loading}
          />
        ))}
      </div>
    </ChartPanel>
  );
}
