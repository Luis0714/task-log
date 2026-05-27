import { UserRound } from "lucide-react";

import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemTypeAvatar } from "@/components/work-items/work-item-type-avatar";
import { WorkItemOptionHeader } from "@/components/time-log/work-item-option-header";
import {
  WORK_ITEM_SELECT_ITEM_CLASS,
  WORK_ITEM_SELECT_OPTION_CLASS,
} from "@/components/time-log/work-item-select-item-classes";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export { WORK_ITEM_SELECT_ITEM_CLASS } from "@/components/time-log/work-item-select-item-classes";

export type WorkItemSelectOptionProps = {
  item: AdoWorkItemOptionDto;
  /** `select` para ítems del dropdown; `menu` para tarjeta completa; `trigger` para el valor seleccionado. */
  variant?: "menu" | "select" | "trigger";
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
        "dark:border-white/6 dark:bg-card/90",
        className,
      )}
    >
      <WorkItemOptionHeader item={item} />

      <div className="mt-2 flex min-w-0 items-center gap-2.5">
        <WorkItemTypeAvatar type={item.type} className="shrink-0" />
        <TruncatedTitle
          title={item.title}
          className="text-foreground text-left text-[15px] leading-snug font-semibold"
        />
      </div>

      {item.assignedTo ? (
        <WorkItemAssigneeRow assignedTo={item.assignedTo} className="mt-3.5" />
      ) : null}
    </div>
  );
}

function WorkItemSelectMenuOption({ item }: { item: AdoWorkItemOptionDto }) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1", WORK_ITEM_SELECT_OPTION_CLASS)}>
      <WorkItemOptionHeader item={item} />
      <TruncatedTitle
        title={item.title}
        className="text-foreground text-left text-sm leading-snug font-medium"
      />
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

  if (variant === "select") {
    return <WorkItemSelectMenuOption item={item} />;
  }

  return <WorkItemOptionCard item={item} className={className} />;
}
