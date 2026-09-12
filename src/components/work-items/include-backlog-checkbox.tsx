"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type IncludeBacklogCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function IncludeBacklogCheckbox({
  checked,
  onCheckedChange,
}: IncludeBacklogCheckboxProps) {
  return (
    <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      Incluir backlog completo
    </Label>
  );
}
