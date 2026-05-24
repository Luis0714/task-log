import { UserRound } from "lucide-react";

import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemTypeAvatar } from "@/components/work-items/work-item-type-avatar";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export const WORK_ITEM_SELECT_ITEM_CLASS =
  "h-auto min-h-0 items-start overflow-hidden rounded-lg p-1 focus:bg-transparent data-highlighted:bg-transparent";

export type WorkItemSelectOptionProps = {
  item: AdoWorkItemOptionDto;
  /** `menu` para ítems del dropdown; `trigger` para el valor seleccionado en el botón. */
  variant?: "menu" | "trigger";
  className?: string;
};

type TruncatedTitleProps = {
  title: string;
  className?: string;
};

function TruncatedTitle({ title, className }: TruncatedTitleProps) {
  return (
    <p
      className={cn(
        "block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      title={title}
    >
      {title}
    </p>
  );
}

type WorkItemAssigneeRowProps = {
  assignedTo: string;
  className?: string;
};

function WorkItemAssigneeRow({ assignedTo, className }: WorkItemAssigneeRowProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25">
        <UserRound className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-muted-foreground text-[10px] leading-none font-semibold tracking-widest uppercase">
          Asignado a
        </p>
        <TruncatedTitle title={assignedTo} className="text-foreground mt-1 text-sm leading-tight" />
      </div>
    </div>
  );
}

type WorkItemOptionCardProps = {
  item: AdoWorkItemOptionDto;
  className?: string;
};

function WorkItemOptionCard({ item, className }: WorkItemOptionCardProps) {
  return (
    <div
      className={cn(
        "box-border flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 shadow-sm",
        "dark:border-white/[0.06] dark:bg-card/90",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <WorkItemId id={item.id} />
        {item.state ? <WorkItemStateBadge state={item.state} /> : null}
      </div>

      <WorkItemTypeAvatar type={item.type} className="mt-2.5" />

      <TruncatedTitle
        title={item.title}
        className="text-foreground mt-2 text-left text-[15px] leading-snug font-semibold"
      />

      {item.assignedTo ? <WorkItemAssigneeRow assignedTo={item.assignedTo} className="mt-3.5" /> : null}
    </div>
  );
}

export function WorkItemSelectOption({
  item,
  variant = "menu",
  className,
}: WorkItemSelectOptionProps) {
  if (variant === "trigger") {
    return (
      <span className={cn("flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden", className)}>
        <WorkItemId id={item.id} />
        <WorkItemTypeAvatar type={item.type} size="sm" />
        <span className="min-w-0 flex-1 overflow-hidden">
          <TruncatedTitle title={item.title} className="text-sm font-semibold" />
        </span>
      </span>
    );
  }

  return <WorkItemOptionCard item={item} className={className} />;
}
