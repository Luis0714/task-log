"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import { SPRINT_TIMES_WEEK_ALL } from "@/lib/sprints/filter-sprint-times-by-week";
import type { SprintTimesWeekColumn } from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export type SprintTimesWeekSelectProps = {
  weeks: readonly SprintTimesWeekColumn[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

function weekOptionLabel(week: SprintTimesWeekColumn): string {
  if (!week.dateRangeLabel) return week.label;
  return `${week.label} (${week.dateRangeLabel})`;
}

export function SprintTimesWeekSelect({
  weeks,
  value,
  onValueChange,
  disabled = false,
  className,
}: Readonly<SprintTimesWeekSelectProps>) {
  const options = [
    { value: SPRINT_TIMES_WEEK_ALL, label: "Todas las semanas" },
    ...weeks.map((week, index) => ({
      value: String(index),
      label: weekOptionLabel(week),
    })),
  ];

  const selected = options.find((option) => option.value === value);

  return (
    <div className={cn("w-52 [&_label]:sr-only", className)}>
      <ControlledSelectField
        label="Semanas del sprint"
        value={value}
        placeholder="Todas las semanas"
        disabled={disabled || weeks.length <= 1}
        displayValue={selected?.label}
        options={options}
        onValueChange={onValueChange}
      />
    </div>
  );
}
