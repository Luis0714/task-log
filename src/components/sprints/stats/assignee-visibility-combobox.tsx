"use client";

import { Eye, EyeOff, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

export type AssigneeVisibilityComboboxProps = {
  assignees: readonly string[];
  hiddenAssignees: ReadonlySet<string>;
  onToggle: (assignee: string) => void;
};

export function AssigneeVisibilityCombobox({
  assignees,
  hiddenAssignees,
  onToggle,
}: AssigneeVisibilityComboboxProps) {
  const anchor = useComboboxAnchor();
  const total = assignees.length;
  const hiddenCount = assignees.filter((a) => hiddenAssignees.has(a)).length;
  const visibleCount = total - hiddenCount;
  const triggerLabel =
    hiddenCount === 0
      ? `Personas (${total})`
      : `Personas (${visibleCount}/${total})`;

  return (
    <div ref={anchor} className="w-auto">
      <Combobox
        multiple
        value={[...hiddenAssignees]}
        onValueChange={(next: string[]) => {
          const nextSet = new Set(next);
          for (const assignee of assignees) {
            const wasHidden = hiddenAssignees.has(assignee);
            const isHidden = nextSet.has(assignee);
            if (wasHidden !== isHidden) onToggle(assignee);
          }
        }}
        items={[...assignees]}
      >
        <ComboboxTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={triggerLabel}
              className="gap-1.5"
            />
          }
        >
          {hiddenCount === 0 ? (
            <UsersRound className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
          <span className="hidden sm:inline">{triggerLabel}</span>
        </ComboboxTrigger>

        <ComboboxContent anchor={anchor} className="w-72">
          <ComboboxInput
            placeholder="Buscar persona…"
            showTrigger={false}
            showClear={false}
          />
          <ComboboxList>
            <ComboboxValue>{() => null}</ComboboxValue>
            <ComboboxCollection>
              {(assignee: string) => {
                const isHidden = hiddenAssignees.has(assignee);
                return (
                  <ComboboxItem key={assignee} value={assignee}>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{assignee}</span>
                      <span
                        className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs"
                        aria-hidden
                      >
                        {isHidden ? (
                          <>
                            <EyeOff className="size-3.5" /> Oculto
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" /> Visible
                          </>
                        )}
                      </span>
                    </span>
                  </ComboboxItem>
                );
              }}
            </ComboboxCollection>
            <ComboboxEmpty>No hay personas para mostrar.</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
