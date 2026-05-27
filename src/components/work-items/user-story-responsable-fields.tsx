"use client";

import { TeamMemberSelect } from "@/components/work-items/team-member-select";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type UserStoryResponsableFieldsProps = {
  fields: readonly BacklogResponsableFieldDto[];
  values: {
    maquetacion: string;
    integrador: string;
    qa: string;
  };
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange: (key: keyof UserStoryResponsableFieldsProps["values"], value: string) => void;
};

const VALUE_KEYS = {
  maquetacion: "maquetacion",
  integrador: "integrador",
  qa: "qa",
} as const;

export function UserStoryResponsableFields({
  fields,
  values,
  members,
  membersLoading = false,
  disabled = false,
  required = false,
  onChange,
}: UserStoryResponsableFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <section className="space-y-4">
      <p className="text-muted-foreground text-xs">
        {required
          ? "Obligatorios al pasar a QA. También puedes editarlos en cualquier estado."
          : "Puedes ver y editar los responsables asignados en Azure DevOps."}
      </p>
      {fields.map((field) => {
        const valueKey = VALUE_KEYS[field.key];
        return (
          <TeamMemberSelect
            key={field.key}
            id={`user-story-responsable-${field.key}`}
            label={field.label}
            required={required}
            value={values[valueKey]}
            members={members}
            membersLoading={membersLoading}
            disabled={disabled}
            onChange={(value) => onChange(valueKey, value)}
          />
        );
      })}
    </section>
  );
}
