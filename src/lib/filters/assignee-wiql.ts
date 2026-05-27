import { escapeWiqlString } from "@/lib/azure-devops/client";
import { parseAssigneeFilter } from "@/lib/schemas/work-item-filters";

/** Condición WIQL para asignación, o `null` si no aplica filtro (todos). */
export function buildAssigneeWiqlCondition(assignee: string): string | null {
  const filter = parseAssigneeFilter(assignee);

  if (filter.kind === "all") return null;

  const clauses: string[] = [];
  if (filter.includeMe) clauses.push("[System.AssignedTo] = @Me");
  for (const name of filter.names) {
    clauses.push(`[System.AssignedTo] = '${escapeWiqlString(name)}'`);
  }

  if (clauses.length === 0) return "[System.AssignedTo] = @Me";
  if (clauses.length === 1) return clauses[0];
  return `(${clauses.join(" OR ")})`;
}
