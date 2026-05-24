"use client";

import { ControlledSelectField } from "@/components/time-log/fields/form-select-field";
import {
  formatSprintDayOptionLabel,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
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

  if (workingDays.length === 0) return null;

  return (
    <div className={cn(!showLabel && "[&_label]:sr-only", className)}>
      <ControlledSelectField
        label="Día del sprint"
        value={value}
        placeholder="Selecciona un día"
        disabled={disabled || workingDays.length <= 1}
        triggerClassName="min-w-[12rem]"
        displayValue={selectedDay ? formatSprintDayOptionLabel(selectedDay) : undefined}
        options={workingDays.map((day) => ({
          value: day.value,
          label: formatSprintDayOptionLabel(day),
        }))}
        onValueChange={onValueChange}
      />
    </div>
  );
}
