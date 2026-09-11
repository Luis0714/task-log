"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PbiStateDot } from "@/components/work-items/pbi-state-dot";
import { WorkItemKindIcon } from "@/components/work-items/work-item-kind-icon";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";
import { linkableWorkItemSelectedLabel } from "@/lib/work-items/linkable-work-item-options";

export type LinkableWorkItemSelectedRowProps = {
  item: LinkableWorkItemDto;
  onRemove: (id: number) => void;
};

export function LinkableWorkItemSelectedRow({
  item,
  onRemove,
}: LinkableWorkItemSelectedRowProps) {
  const label = linkableWorkItemSelectedLabel(item);

  return (
    <li className="flex items-start gap-2 py-2">
      <WorkItemKindIcon kind={item.kind} className="mt-0.5" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-primary">
          <span className="truncate" title={label}>
            {label}
          </span>
          {item.state ? (
            <span title={item.state} className="shrink-0">
              <PbiStateDot state={item.state} className="size-1.5" />
            </span>
          ) : null}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground mt-0.5 shrink-0"
        aria-label={`Quitar ${label}`}
        onClick={() => onRemove(item.id)}
      >
        <X />
      </Button>
    </li>
  );
}
