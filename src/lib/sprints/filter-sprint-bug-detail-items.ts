import type { SprintBugDetailItem } from "@/lib/sprints/sprint-stats-types";

export const SPRINT_BUG_UNASSIGNED_LABEL = "Sin asignar";

export type SprintBugDetailFilterKind = "state" | "assignee";

export type SprintBugDetailFilter = {
  kind: SprintBugDetailFilterKind;
  values: readonly string[];
};

export function resolveSprintBugAssigneeLabel(assignedTo: string | null): string {
  return assignedTo?.trim() || SPRINT_BUG_UNASSIGNED_LABEL;
}

export function filterSprintBugDetailItems(
  items: readonly SprintBugDetailItem[],
  filter: SprintBugDetailFilter | null,
): SprintBugDetailItem[] {
  if (!filter || filter.values.length === 0) return [...items];

  const valueSet = new Set(filter.values);

  if (filter.kind === "state") {
    return items.filter((item) => valueSet.has(item.state));
  }

  return items.filter(
    (item) => valueSet.has(resolveSprintBugAssigneeLabel(item.assignedTo)),
  );
}

export function describeSprintBugDetailFilter(filter: SprintBugDetailFilter): string {
  if (filter.kind === "state") {
    if (filter.values.length === 1) return `Estado: ${filter.values[0]}`;
    return `Estados: ${filter.values.join(", ")}`;
  }

  if (filter.values.length === 1) return `Asignado: ${filter.values[0]}`;
  return `Asignados: ${filter.values.join(", ")}`;
}

export function isSprintBugDetailFilterValueSelected(
  filter: SprintBugDetailFilter | null,
  kind: SprintBugDetailFilterKind,
  value: string,
): boolean {
  return filter?.kind === kind && filter.values.includes(value);
}

export function toggleSprintBugDetailFilterValue(
  current: SprintBugDetailFilter | null,
  kind: SprintBugDetailFilterKind,
  value: string,
): SprintBugDetailFilter | null {
  if (current?.kind !== kind) {
    return { kind, values: [value] };
  }

  const nextValues = current.values.includes(value)
    ? current.values.filter((entry) => entry !== value)
    : [...current.values, value];

  return nextValues.length > 0 ? { kind, values: nextValues } : null;
}
