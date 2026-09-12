import type { FormSelectOption } from "@/components/time-log/fields/controlled-select-field";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { ANY_FILTER_VALUE } from "@/lib/pull-requests/types";

export function buildPersonFilterOptions(
  members: readonly AdoTeamMemberDto[],
  extras: readonly FormSelectOption[] = [],
): FormSelectOption[] {
  return [
    { value: ANY_FILTER_VALUE, label: "Cualquiera" },
    ...extras,
    ...members.map((member) => ({
      value: member.displayName,
      label: member.displayName,
      key: member.id,
    })),
  ];
}

export function personFilterDisplayValue(value: string): string {
  if (value === ANY_FILTER_VALUE) return "Cualquiera";
  return value;
}
