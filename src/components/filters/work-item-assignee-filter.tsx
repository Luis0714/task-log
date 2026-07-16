"use client";

import { ChevronDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterPresetRow } from "@/components/filters/filter-preset-row";
import { filterFieldTriggerClassName } from "@/components/filters/filter-field-trigger-classes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWorkItemAssigneeFilterState } from "@/hooks/filters/use-work-item-assignee-filter-state";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type WorkItemAssigneeFilterProps = {
  id: string;
  assignee: string;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  membersError?: string | null;
  disabled?: boolean;
  /**
   * Si es `true`, oculta las opciones por-miembro y la fila "Todos los
   * miembros", dejando solo "Asignados a mí" como estado forzado.
   * Usado en módulos donde el usuario sin rol de gestión no debe ver
   * novedades de otros colaboradores (HU-04 Solicitudes y Novedades).
   */
  restrictToCurrentUser?: boolean;
  onAssigneeChange: (value: string) => void;
};

export function WorkItemAssigneeFilter({
  id,
  assignee,
  members,
  membersLoading = false,
  membersError = null,
  disabled = false,
  restrictToCurrentUser = false,
  onAssigneeChange,
}: Readonly<WorkItemAssigneeFilterProps>) {
  const {
    includeMe,
    isAll,
    selectedSet,
    triggerLabel,
    commitAssignee,
    toggleMe,
    toggleMember,
  } = useWorkItemAssigneeFilterState({
    assignee,
    members,
    membersLoading,
    onAssigneeChange,
  });

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Asignación</Label>
      {restrictToCurrentUser ? (
        <div className="border-input bg-muted/30 text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm">
          Asignados a mí
        </div>
      ) : (
        <Popover>
          <PopoverTrigger
            id={id}
            disabled={disabled || membersLoading}
            className={filterFieldTriggerClassName()}
          >
            <span className="truncate text-left">{triggerLabel}</span>
            <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </PopoverTrigger>
          <PopoverContent className="w-(--anchor-width) p-2" align="start">
            <div className="space-y-0.5">
              <FilterPresetRow
                label="Todos los miembros"
                active={isAll}
                onSelect={() => commitAssignee(WORK_ITEM_ASSIGNEE_ALL)}
              />
              <label
                htmlFor={`${id}-me`}
                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
              >
                <Checkbox
                  id={`${id}-me`}
                  checked={!isAll && includeMe}
                  onCheckedChange={(next) => toggleMe(next === true)}
                />
                <span className="text-sm">Asignados a mí</span>
              </label>
            </div>
            {members.length > 0 ? (
              <>
                <div className="bg-border my-2 h-px" />
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {members.map((member) => {
                    const optionId = `${id}-member-${member.id}`;
                    const checked = !isAll && selectedSet.has(member.displayName);
                    return (
                      <label
                        key={member.id}
                        htmlFor={optionId}
                        className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                      >
                        <Checkbox
                          id={optionId}
                          checked={checked}
                          onCheckedChange={(next) =>
                            toggleMember(member.displayName, next === true)
                          }
                        />
                        <span className="text-sm">{member.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : null}
          </PopoverContent>
        </Popover>
      )}
      {membersError ? (
        <p className="text-destructive text-xs">{membersError}</p>
      ) : null}
    </div>
  );
}
