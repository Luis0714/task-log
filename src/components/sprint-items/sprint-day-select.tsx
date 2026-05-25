"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import {
  formatSprintDayOptionLabel,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import { SPRINT_DAY_ALL } from "@/lib/sprint-items/filter-by-criteria";
import { cn } from "@/lib/utils";

export type SprintDaySelectProps = {
  value: string;
  workingDays: SprintWorkingDay[];
  disabled?: boolean;
  showLabel?: boolean;
  onValueChange: (value: string) => void;
  className?: string;
};

export function SprintDaySelect({
  value,
  workingDays,
  disabled = false,
  showLabel = false,
  onValueChange,
  className,
}: SprintDaySelectProps) {
  const selectedDay = workingDays.find((day) => day.value === value) ?? null;
  const displayValue =
    value === SPRINT_DAY_ALL
      ? "Todos los días"
      : selectedDay
        ? formatSprintDayOptionLabel(selectedDay)
        : undefined;

  return (
    <div className={cn(!showLabel && "[&_label]:sr-only", className)}>
      <ControlledSelectField
        label="Día"
        value={value || SPRINT_DAY_ALL}
        placeholder="Selecciona un día"
        disabled={disabled}
        displayValue={displayValue}
        options={[
          { value: SPRINT_DAY_ALL, label: "Todos los días" },
          ...workingDays.map((day) => ({
            value: day.value,
            label: formatSprintDayOptionLabel(day),
          })),
        ]}
        onValueChange={onValueChange}
      />
    </div>
  );
}
