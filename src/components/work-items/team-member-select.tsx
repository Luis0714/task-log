"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TeamMemberSelectProps = {
  id: string;
  label: string;
  value: string;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function TeamMemberSelect({
  id,
  label,
  value,
  members,
  membersLoading = false,
  disabled = false,
  onChange,
}: TeamMemberSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={(next) => onChange(next ?? "")}
        disabled={disabled || membersLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={membersLoading ? "Cargando miembros…" : "Selecciona una persona"}
          />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.displayName}>
              {member.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
