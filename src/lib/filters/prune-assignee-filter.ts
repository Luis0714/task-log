import {
  assigneeMatchesMember,
  type AssigneeMemberLookup,
} from "@/lib/filters/person-name";
import {
  parseAssigneeFilter,
  serializeAssigneeFilter,
} from "@/lib/schemas/work-item-filters";

/** Elimina nombres que ya no están en la lista; conserva «Asignados a mí» si aplica. */
export function pruneAssigneeMemberSelection(
  assignee: string,
  members: readonly AssigneeMemberLookup[],
): string {
  const filter = parseAssigneeFilter(assignee);
  if (filter.kind !== "selection" || members.length === 0) return assignee;

  const valid = filter.names.filter((name) => assigneeMatchesMember(members, name));
  if (valid.length === filter.names.length) return assignee;

  return serializeAssigneeFilter({
    kind: "selection",
    includeMe: filter.includeMe,
    names: valid,
  });
}
