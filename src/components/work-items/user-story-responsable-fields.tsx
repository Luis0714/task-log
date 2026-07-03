"use client";

import { TeamMemberSelect } from "@/components/work-items/team-member-select";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type UserStoryResponsableFieldsProps = {
  fields: readonly BacklogResponsableFieldDto[];
  /** Mapa `referenceName → displayName` con los valores actuales del form. */
  values: Readonly<Record<string, string>>;
  members: readonly AdoTeamMemberDto[];
  membersLoading?: boolean;
  disabled?: boolean;
  /** Indica que estamos en transición a QA (los campos requeridos se marcan). */
  required?: boolean;
  /** Recibe el `referenceName` y el nuevo valor. */
  onChange: (referenceName: string, value: string) => void;
};

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
          ? "Obligatorios al pasar a QA. Si los dejas vacíos y tienen «Asignarme por defecto», se usará tu usuario."
          : "Puedes ver y editar los responsables asignados en Azure DevOps."}
      </p>
      {fields.map((field) => {
        // En QA: el campo es required solo si NO tiene defaultToCurrentUser (porque
        // los que sí lo tienen los rellena el servidor con el usuario logueado).
        const isRequired = required && !field.defaultToCurrentUser;
        return (
          <TeamMemberSelect
            key={field.referenceName}
            id={`user-story-responsable-${field.referenceName}`}
            label={field.label}
            required={isRequired}
            value={values[field.referenceName] ?? ""}
            members={members}
            membersLoading={membersLoading}
            disabled={disabled}
            onChange={(value) => onChange(field.referenceName, value)}
          />
        );
      })}
    </section>
  );
}