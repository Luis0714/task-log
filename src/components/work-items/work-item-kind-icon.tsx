import { Bug, CheckSquare, ListTodo, type LucideIcon } from "lucide-react";

import type { LinkableWorkItemKind } from "@/lib/work-items/linkable-work-item";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<LinkableWorkItemKind, LucideIcon> = {
  pbi: ListTodo,
  task: CheckSquare,
  bug: Bug,
};

const KIND_ICON_CLASS: Record<LinkableWorkItemKind, string> = {
  pbi: "text-sky-500",
  task: "text-amber-500",
  bug: "text-red-500",
};

export type WorkItemKindIconProps = {
  kind: LinkableWorkItemKind;
  className?: string;
};

export function WorkItemKindIcon({ kind, className }: WorkItemKindIconProps) {
  const Icon = KIND_ICONS[kind];

  return (
    <Icon
      className={cn("size-3.5 shrink-0", KIND_ICON_CLASS[kind], className)}
      aria-hidden
    />
  );
}
