import type { ReviewTimeRow } from "@/lib/review-times/types";

export type PersonOption = {
  value: string;
  label: string;
};

export function distinctPeople(
  rows: readonly ReviewTimeRow[],
  idOf: (row: ReviewTimeRow) => string | null,
  nameOf: (row: ReviewTimeRow) => string,
): PersonOption[] {
  const byId = new Map<string, string>();
  for (const row of rows) {
    const id = idOf(row);
    if (!id || byId.has(id)) continue;
    byId.set(id, nameOf(row));
  }
  return [...byId.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "es"));
}

export function selectionTriggerLabel(
  selected: readonly string[],
  options: readonly PersonOption[],
  allLabel: string,
  countedNoun: string,
): string {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) {
    return options.find((option) => option.value === selected[0])?.label ?? selected[0];
  }
  return `${selected.length} ${countedNoun}`;
}
