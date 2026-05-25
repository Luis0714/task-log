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
  includeAllDays?: boolean;
  label?: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function SprintDaySelect({
  value,
  workingDays,
  disabled = false,
  showLabel = false,
  includeAllDays = false,
  label = "Día del sprint",
  onValueChange,
  className,
}: SprintDaySelectProps) {
  const selectedDay = workingDays.find((day) => day.value === value) ?? null;

  if (!includeAllDays && workingDays.length === 0) return null;

  const displayValue =
    includeAllDays && value === SPRINT_DAY_ALL
      ? "Todos los días"
      : selectedDay
        ? formatSprintDayOptionLabel(selectedDay)
        : undefined;

  const options = includeAllDays
    ? [
        { value: SPRINT_DAY_ALL, label: "Todos los días" },
        ...workingDays.map((day) => ({
          value: day.value,
          label: formatSprintDayOptionLabel(day),
        })),
      ]
    : workingDays.map((day) => ({
        value: day.value,
        label: formatSprintDayOptionLabel(day),
      }));

  return (
    <div className={cn(!showLabel && "[&_label]:sr-only", className)}>
      <ControlledSelectField
        label={label}
        value={includeAllDays ? value || SPRINT_DAY_ALL : value}
        placeholder="Selecciona un día"
        disabled={disabled || (!includeAllDays && workingDays.length <= 1)}
        displayValue={displayValue}
        options={options}
        onValueChange={onValueChange}
      />
    </div>
  );
}
