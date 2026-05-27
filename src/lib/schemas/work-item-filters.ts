import { z } from "zod";

export const WORK_ITEM_ASSIGNEE_ALL = "all";
export const WORK_ITEM_ASSIGNEE_ME = "me";

/** Separador entre varios miembros en la URL (evita romper nombres con coma). */
const ASSIGNEE_LIST_SEPARATOR = "|";
const ASSIGNEE_LIST_SEPARATOR_LEGACY = ",";

export const workItemFiltersSchema = z.object({
  search: z.string(),
  /** `all`, `me` o displayNames (varios unidos con `|`). */
  assignee: z.string(),
  /** Vacío = todos los estados. */
  states: z.array(z.string()),
});

export type WorkItemFilters = z.infer<typeof workItemFiltersSchema>;

export type AssigneeFilter =
  | { kind: "all" }
  | { kind: "me" }
  | { kind: "members"; names: string[] };

export const DEFAULT_WORK_ITEM_FILTERS: WorkItemFilters = {
  search: "",
  assignee: WORK_ITEM_ASSIGNEE_ME,
  states: [],
};

export function isWorkItemAssigneeMe(assignee: string): boolean {
  return assignee === WORK_ITEM_ASSIGNEE_ME;
}

export function isWorkItemAssigneeAll(assignee: string): boolean {
  return assignee === WORK_ITEM_ASSIGNEE_ALL || assignee === "";
}

export function parseAssigneeFilter(assignee: string): AssigneeFilter {
  const trimmed = assignee.trim();
  if (!trimmed || isWorkItemAssigneeAll(trimmed)) return { kind: "all" };
  if (isWorkItemAssigneeMe(trimmed)) return { kind: "me" };

  const names = splitAssigneeMemberNames(trimmed);

  if (names.length === 0) return { kind: "me" };
  return { kind: "members", names };
}

function splitAssigneeMemberNames(value: string): string[] {
  const separator = value.includes(ASSIGNEE_LIST_SEPARATOR)
    ? ASSIGNEE_LIST_SEPARATOR
    : value.includes(ASSIGNEE_LIST_SEPARATOR_LEGACY)
      ? ASSIGNEE_LIST_SEPARATOR_LEGACY
      : null;

  if (!separator) {
    return value.trim() ? [value.trim()] : [];
  }

  return value
    .split(separator)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function parseAssigneeMembers(assignee: string): string[] {
  const filter = parseAssigneeFilter(assignee);
  return filter.kind === "members" ? filter.names : [];
}

export function serializeAssigneeFilter(filter: AssigneeFilter): string {
  if (filter.kind === "all") return WORK_ITEM_ASSIGNEE_ALL;
  if (filter.kind === "me") return WORK_ITEM_ASSIGNEE_ME;
  return serializeAssigneeMembers(filter.names);
}

export function serializeAssigneeMembers(members: readonly string[]): string {
  const unique = [...new Set(members.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) return WORK_ITEM_ASSIGNEE_ME;
  return unique.join(ASSIGNEE_LIST_SEPARATOR);
}

export function workItemMatchesStates(
  itemState: string,
  selectedStates: readonly string[],
): boolean {
  if (selectedStates.length === 0) return true;
  return selectedStates.includes(itemState);
}

export function resolveWorkItemAssigneeLabel(
  assignee: string,
  members: Array<{ displayName: string }>,
): string {
  const filter = parseAssigneeFilter(assignee);

  if (filter.kind === "all") return "Todos";
  if (filter.kind === "me") return "Asignados a mí";
  if (filter.names.length === 1) {
    const member = members.find((item) => item.displayName === filter.names[0]);
    return member?.displayName ?? filter.names[0];
  }
  return `${filter.names.length} personas`;
}

export function resolveWorkItemStatesLabel(
  selectedStates: readonly string[],
  allStatesCount: number,
): string {
  if (selectedStates.length === 0) return "Todos los estados";
  if (selectedStates.length === 1) return selectedStates[0];
  if (allStatesCount > 0 && selectedStates.length === allStatesCount) {
    return "Todos los estados";
  }
  return `${selectedStates.length} estados`;
}
