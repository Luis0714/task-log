"use client";

import { IncludeBacklogCheckbox } from "@/components/work-items/include-backlog-checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type LinkableWorkItemsHeaderProps = {
  selectedCount: number;
  includeBacklog: boolean;
  onIncludeBacklogChange: (checked: boolean) => void;
  onClear: () => void;
};

export function LinkableWorkItemsHeader({
  selectedCount,
  includeBacklog,
  onIncludeBacklogChange,
  onClear,
}: LinkableWorkItemsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Label htmlFor="linkable-work-items" className="flex items-center gap-2">
        Work items a vincular
        {selectedCount > 0 ? <Badge variant="secondary">{selectedCount}</Badge> : null}
      </Label>
      <div className="flex items-center gap-2">
        <IncludeBacklogCheckbox
          checked={includeBacklog}
          onCheckedChange={onIncludeBacklogChange}
        />
        {selectedCount > 0 ? (
          <Button type="button" variant="ghost" size="xs" onClick={onClear}>
            Quitar todos
          </Button>
        ) : null}
      </div>
    </div>
  );
}
