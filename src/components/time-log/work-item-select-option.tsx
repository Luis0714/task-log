import { UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  getWorkItemStatePresentation,
  getWorkItemTypePresentation,
} from "@/lib/time-log/work-item-presentation";
import { cn } from "@/lib/utils";

export const WORK_ITEM_SELECT_ITEM_CLASS =
  "h-auto min-h-10 items-start py-2.5 [&_.whitespace-nowrap]:h-auto [&_.whitespace-nowrap]:whitespace-normal [&_.whitespace-nowrap]:items-start";

export type WorkItemSelectOptionProps = {
  item: AdoWorkItemOptionDto;
  /** `menu` para ítems del dropdown; `trigger` para el valor seleccionado en el botón. */
  variant?: "menu" | "trigger";
  className?: string;
};

export function WorkItemSelectOption({
  item,
  variant = "menu",
  className,
}: WorkItemSelectOptionProps) {
  const statePresentation = getWorkItemStatePresentation(item.state);
  const typePresentation = getWorkItemTypePresentation(item.type);

  if (variant === "trigger") {
    return (
      <span className={cn("flex min-w-0 items-center gap-2", className)}>
        <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
          #{item.id}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
        {item.state ? (
          <Badge
            variant={statePresentation.variant}
            className={cn("h-5 shrink-0 px-1.5 text-[10px]", statePresentation.className)}
          >
            {item.state}
          </Badge>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground shrink-0 font-mono text-xs font-semibold tabular-nums">
            #{item.id}
          </span>
          <Badge
            variant={typePresentation.variant}
            className={cn(
              "h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide",
              typePresentation.className,
            )}
          >
            {item.type}
          </Badge>
        </div>
        {item.state ? (
          <Badge
            variant={statePresentation.variant}
            className={cn("h-5 shrink-0 px-1.5 text-[10px]", statePresentation.className)}
          >
            {item.state}
          </Badge>
        ) : null}
      </div>

      <p className="line-clamp-2 text-left text-sm leading-snug font-medium">{item.title}</p>

      {item.assignedTo ? (
        <p className="text-muted-foreground flex items-center gap-1 truncate text-left text-xs">
          <UserRound className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{item.assignedTo}</span>
        </p>
      ) : null}
    </div>
  );
}
