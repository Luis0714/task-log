"use client";

import { Fragment } from "react";

import { PersonLabel } from "@/components/team-members/person-label";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import {
  coerceTeamMembers,
  extractTeamMemberIds,
} from "@/lib/team-members/person-combobox";

export type PersonPickListProps = {
  id: string;
  label: string;
  placeholder: string;
  members: readonly AdoTeamMemberDto[];
  selectedIds: readonly string[];
  loading?: boolean;
  onChange: (ids: string[]) => void;
};

export function PersonPickList({
  id,
  label,
  placeholder,
  members,
  selectedIds,
  loading = false,
  onChange,
}: PersonPickListProps) {
  const anchor = useComboboxAnchor();
  const selectedMembers = members.filter((member) => selectedIds.includes(member.id));

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Combobox<AdoTeamMemberDto, true>
        multiple
        autoHighlight
        items={[...members]}
        value={selectedMembers}
        disabled={members.length === 0}
        itemToStringLabel={(member) => member.displayName}
        itemToStringValue={(member) => member.id}
        isItemEqualToValue={(member, current) => member.id === current.id}
        onValueChange={(next) => onChange(extractTeamMemberIds(next))}
      >
        <ComboboxChips ref={anchor} className="w-full">
          <ComboboxValue>
            {(values) => (
              <Fragment>
                {coerceTeamMembers(values).map((member) => (
                  <ComboboxChip key={member.id}>
                    <PersonLabel name={member.displayName} />
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput id={id} placeholder={placeholder} />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No hay miembros que coincidan.</ComboboxEmpty>
          <ComboboxList>
            {(item: AdoTeamMemberDto) => (
              <ComboboxItem key={item.id} value={item} className="overflow-hidden">
                <TeamMemberAvatar
                  name={item.displayName}
                  size="sm"
                  className="size-5"
                  fallbackClassName="text-[9px]"
                />
                <span className="min-w-0 truncate">{item.displayName}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
