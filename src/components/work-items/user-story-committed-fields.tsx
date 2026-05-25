"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";

export type UserStoryCommittedFieldsProps = {
  startDate: string;
  targetDate: string;
  disabled?: boolean;
  onStartDateChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
};

export function UserStoryCommittedFields({
  startDate,
  targetDate,
  disabled = false,
  onStartDateChange,
  onTargetDateChange,
}: UserStoryCommittedFieldsProps) {
  return (
    <section className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Start Date y Target Date (requeridas al pasar a Committed).
      </p>
      <div className="space-y-2">
        <Label htmlFor="user-story-start-date">Start Date</Label>
        <DatePicker
          id="user-story-start-date"
          value={startDate}
          disabled={disabled}
          onChange={onStartDateChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-story-target-date">Target Date</Label>
        <DatePicker
          id="user-story-target-date"
          value={targetDate}
          disabled={disabled}
          onChange={onTargetDateChange}
        />
      </div>
    </section>
  );
}
