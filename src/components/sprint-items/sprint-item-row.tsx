import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemPriorityBadge } from "@/components/work-items/work-item-priority-badge";
import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintItemRowSelection = {
  readonly selected: boolean;
  readonly onToggle: (next: boolean) => void;
  readonly disabled?: boolean;
};

export type SprintItemRowProps = {
  item: AdoWorkItemOptionDto;
  showHours?: boolean;
  className?: string;
  onClick?: () => void;
  selection?: SprintItemRowSelection;
};

export function SprintItemRow({
  item,
  showHours = true,
  className,
  onClick,
  selection,
}: SprintItemRowProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <WorkItemId id={item.id} />
          {item.workingDate ? <TaskDateBadge dateKey={item.workingDate} /> : null}
          {item.priority !== undefined ? (
            <WorkItemPriorityBadge priority={item.priority} />
          ) : null}
        </div>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium" title={item.title}>
          {item.title}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
        {showHours && item.loggedHours !== undefined ? (
          <WorkItemHoursLabel hours={item.loggedHours} suffix="" className="text-xs" />
        ) : null}
        {item.state ? <StatusBadge state={item.state} className="max-w-30" /> : null}
      </div>
    </>
  );

  const rowClassName = cn(
    "flex w-full min-w-0 items-center gap-3 px-3 py-2.5",
    "transition-colors",
    onClick && "cursor-pointer",
    className,
  );

  // Con selección activa: separamos el row en [checkbox] + [contenido clickeable].
  // Esto evita anidar un <button> dentro de otro <button> (HTML inválido) y nos
  // permite manejar cada interacción de forma independiente.
  if (selection) {
    return (
      <div className={cn("group/row", onClick && "hover:bg-muted/40")}>
        <div className="flex w-full items-center gap-3 px-3 py-1.5">
          <Checkbox
            checked={selection.selected}
            disabled={selection.disabled}
            onCheckedChange={(next) => selection.onToggle(next)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Seleccionar tarea #${item.id}`}
          />
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="-mx-1 flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left"
            >
              {content}
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
          )}
        </div>
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(rowClassName, "rounded-lg border border-transparent text-left hover:border-border/60 hover:bg-muted/40")}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(rowClassName, "rounded-lg border border-transparent")}>
      {content}
    </div>
  );
}
