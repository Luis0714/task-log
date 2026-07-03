import { z } from "zod";

import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";

export const WORK_ITEM_ASSIGNEE_ALL = "all";
export const WORK_ITEM_ASSIGNEE_ME = "me";

/** Separador entre varios miembros en la URL (evita romper nombres con coma). */
const ASSIGNEE_LIST_SEPARATOR = "|";
const ASSIGNEE_LIST_SEPARATOR_LEGACY = ",";

export const workItemFiltersSchema = z.object({
  search: z.string(),
  /** `all`, `me`, `me|Nombre` o nombres unidos con `|`. */
  assignee: z.string(),
  /** Vacío = todos los estados. */
  states: z.array(z.string()),
});

export type WorkItemFilters = z.infer<typeof workItemFiltersSchema>;

export type AssigneeFilter =
  | { kind: "all" }
  | { kind: "selection"; includeMe: boolean; names: string[] };

export const DEFAULT_WORK_ITEM_FILTERS: WorkItemFilters = {
  search: "",
  assignee: WORK_ITEM_ASSIGNEE_ME,
  states: [],
};

export function isWorkItemAssigneeMe(assignee: string): boolean {
  const filter = parseAssigneeFilter(assignee);
  return (
    filter.kind === "selection" &&
    filter.includeMe &&
    filter.names.length === 0
  );
}

export function isWorkItemAssigneeDefault(assignee: string): boolean {
  return assignee === DEFAULT_WORK_ITEM_FILTERS.assignee;
}

export function isWorkItemAssigneeAll(assignee: string): boolean {
  return assignee === WORK_ITEM_ASSIGNEE_ALL || assignee === "";
}

export function parseAssigneeFilter(assignee: string): AssigneeFilter {
  const trimmed = assignee.trim();
  if (!trimmed || trimmed === WORK_ITEM_ASSIGNEE_ALL) return { kind: "all" };

  if (trimmed === WORK_ITEM_ASSIGNEE_ME) {
    return { kind: "selection", includeMe: true, names: [] };
  }

  const tokens = splitAssigneeTokens(trimmed);
  const includeMe = tokens.includes(WORK_ITEM_ASSIGNEE_ME);
  const names = tokens.filter((token) => token !== WORK_ITEM_ASSIGNEE_ME);

  if (!includeMe && names.length === 0) {
    return { kind: "selection", includeMe: true, names: [] };
  }

  return { kind: "selection", includeMe, names };
}

function splitAssigneeTokens(value: string): string[] {
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
    .map((token) => token.trim())
    .filter(Boolean);
}

export function parseAssigneeMembers(assignee: string): string[] {
  const filter = parseAssigneeFilter(assignee);
  return filter.kind === "selection" ? filter.names : [];
}

export function serializeAssigneeSelection(selection: {
  includeMe: boolean;
  names: readonly string[];
}): string {
  const names = [
    ...new Set(selection.names.map((name) => name.trim()).filter(Boolean)),
  ];

  if (!selection.includeMe && names.length === 0) {
    return WORK_ITEM_ASSIGNEE_ME;
  }

  const tokens: string[] = [];
  if (selection.includeMe) tokens.push(WORK_ITEM_ASSIGNEE_ME);
  tokens.push(...names);

  if (tokens.length === 1 && tokens[0] === WORK_ITEM_ASSIGNEE_ME) {
    return WORK_ITEM_ASSIGNEE_ME;
  }

  return tokens.join(ASSIGNEE_LIST_SEPARATOR);
}

export function serializeAssigneeFilter(filter: AssigneeFilter): string {
  if (filter.kind === "all") return WORK_ITEM_ASSIGNEE_ALL;
  return serializeAssigneeSelection({
    includeMe: filter.includeMe,
    names: filter.names,
  });
}

/** @deprecated Usa serializeAssigneeSelection */
export function serializeAssigneeMembers(
  members: readonly string[],
  options?: { includeMe?: boolean },
): string {
  return serializeAssigneeSelection({
    includeMe: options?.includeMe ?? false,
    names: members,
  });
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

  if (filter.kind === "all") return "Todos los miembros";

  const parts: string[] = [];
  if (filter.includeMe) parts.push("Asignados a mí");

  for (const name of filter.names) {
    const member = findTeamMemberByAssigneeName(members, name);
    parts.push(member?.displayName ?? name);
  }

  if (parts.length === 0) return "Asignados a mí";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
  return `${parts[0]} y ${parts.length - 1} más`;
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
