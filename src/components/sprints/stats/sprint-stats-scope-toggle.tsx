"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SprintStatsScopeToggleProps = {
  goalOnly: boolean;
  onGoalOnlyChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function SprintStatsScopeToggle({
  goalOnly,
  onGoalOnlyChange,
  disabled = false,
  className,
}: SprintStatsScopeToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Checkbox
        id="sprint-stats-goal-only"
        checked={goalOnly}
        disabled={disabled}
        onCheckedChange={(checked) => onGoalOnlyChange(checked === true)}
      />
      <Label
        htmlFor="sprint-stats-goal-only"
        className={cn(
          "cursor-pointer text-sm font-normal",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        Solo historias del objetivo
      </Label>
    </div>
  );
}
