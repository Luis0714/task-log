"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TeamMemberSelectProps = {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function TeamMemberSelect({
  id,
  label,
  required = false,
  value,
  members,
  membersLoading = false,
  disabled = false,
  onChange,
}: TeamMemberSelectProps) {
  const selectedMember = members.find((member) => member.displayName === value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Select
        value={value.trim() ? value : ""}
        onValueChange={(next) => onChange(next ?? "")}
        disabled={disabled || membersLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={membersLoading ? "Cargando miembros…" : "Selecciona una persona"}
          >
            {selectedMember ? (
              <span className="flex items-center gap-2 min-w-0">
                <TeamMemberAvatar member={selectedMember} size="sm" />
                <span className="truncate">{selectedMember.displayName}</span>
              </span>
            ) : value.trim() ? (
              <span className="truncate">{value}</span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {value.trim() &&
          !members.some((member) => member.displayName === value) ? (
            <SelectItem value={value}>
              <span className="flex items-center gap-2 min-w-0">
                <TeamMemberAvatar
                  member={{ displayName: value }}
                  size="sm"
                />
                <span className="truncate">{value}</span>
              </span>
            </SelectItem>
          ) : null}
          {members.map((member) => (
            <SelectItem key={member.id} value={member.displayName}>
              <span className="flex items-center gap-2 min-w-0">
                <TeamMemberAvatar member={member} size="sm" />
                <span className="truncate">{member.displayName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
