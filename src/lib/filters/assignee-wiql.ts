import { escapeWiqlString } from "@/lib/azure-devops/client";
import { parseAssigneeFilter } from "@/lib/schemas/work-item-filters";

/** Condición WIQL para asignación usando `field` como referencia, o `null` para "todos". */
export function buildFieldAssigneeWiqlCondition(
  field: string,
  assignee: string,
): string | null {
  const filter = parseAssigneeFilter(assignee);

  if (filter.kind === "all") return null;

  const clauses: string[] = [];
  if (filter.includeMe) clauses.push(`[${field}] = @Me`);
  for (const name of filter.names) {
    clauses.push(`[${field}] = '${escapeWiqlString(name)}'`);
  }

  if (clauses.length === 0) return `[${field}] = @Me`;
  if (clauses.length === 1) return clauses[0];
  return `(${clauses.join(" OR ")})`;
}

/** Condición WIQL para asignación usando `System.AssignedTo`, o `null` para "todos". */
export function buildAssigneeWiqlCondition(assignee: string): string | null {
  return buildFieldAssigneeWiqlCondition("System.AssignedTo", assignee);
}
