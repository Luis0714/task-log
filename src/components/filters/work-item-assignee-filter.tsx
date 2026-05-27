"use client";

import { ChevronDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterPresetRow } from "@/components/filters/filter-preset-row";
import { filterFieldTriggerClassName } from "@/components/filters/filter-field-trigger-classes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import {
  WORK_ITEM_ASSIGNEE_ALL,
  WORK_ITEM_ASSIGNEE_ME,
  parseAssigneeFilter,
  resolveWorkItemAssigneeLabel,
  serializeAssigneeMembers,
} from "@/lib/schemas/work-item-filters";

export type WorkItemAssigneeFilterProps = {
  id: string;
  assignee: string;
  members: AdoTeamMemberDto[];
  membersLoading?: boolean;
  membersError?: string | null;
  disabled?: boolean;
  onAssigneeChange: (value: string) => void;
};

export function WorkItemAssigneeFilter({
  id,
  assignee,
  members,
  membersLoading = false,
  membersError = null,
  disabled = false,
  onAssigneeChange,
}: WorkItemAssigneeFilterProps) {
  const assigneeFilter = parseAssigneeFilter(assignee);
  const selectedMembers = assigneeFilter.kind === "members" ? assigneeFilter.names : [];
  const selectedSet = new Set(selectedMembers);
  const triggerLabel = membersLoading
    ? "Cargando miembros..."
    : resolveWorkItemAssigneeLabel(assignee, members);

  const selectPreset = (value: string) => {
    onAssigneeChange(value);
  };

  const toggleMember = (displayName: string, checked: boolean) => {
    if (checked) {
      const next = [...selectedMembers, displayName];
      onAssigneeChange(serializeAssigneeMembers(next));
      return;
    }
    const next = selectedMembers.filter((name) => name !== displayName);
    onAssigneeChange(
      next.length > 0 ? serializeAssigneeMembers(next) : WORK_ITEM_ASSIGNEE_ME,
    );
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Asignación</Label>
      <Popover>
        <PopoverTrigger
          id={id}
          disabled={disabled || membersLoading}
          className={filterFieldTriggerClassName()}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] p-2" align="start">
          <div className="space-y-0.5">
            <FilterPresetRow
              label="Asignados a mí"
              active={assigneeFilter.kind === "me"}
              onSelect={() => selectPreset(WORK_ITEM_ASSIGNEE_ME)}
            />
            <FilterPresetRow
              label="Todos"
              active={assigneeFilter.kind === "all"}
              onSelect={() => selectPreset(WORK_ITEM_ASSIGNEE_ALL)}
            />
          </div>
          {members.length > 0 ? (
            <>
              <div className="bg-border my-2 h-px" />
              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {members.map((member) => {
                  const optionId = `${id}-member-${member.id}`;
                  const checked =
                    assigneeFilter.kind === "members" &&
                    selectedSet.has(member.displayName);
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
      {membersError ? (
        <p className="text-destructive text-xs">{membersError}</p>
      ) : null}
    </div>
  );
}
