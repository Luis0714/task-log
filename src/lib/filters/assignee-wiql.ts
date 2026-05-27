import { escapeWiqlString } from "@/lib/azure-devops/client";
import { parseAssigneeFilter } from "@/lib/schemas/work-item-filters";

/** Condición WIQL para asignación, o `null` si no aplica filtro (todos). */
export function buildAssigneeWiqlCondition(assignee: string): string | null {
  const filter = parseAssigneeFilter(assignee);

  switch (filter.kind) {
    case "me":
      return "[System.AssignedTo] = @Me";
    case "all":
      return null;
    case "members": {
      if (filter.names.length === 0) return null;
      if (filter.names.length === 1) {
        return `[System.AssignedTo] = '${escapeWiqlString(filter.names[0])}'`;
      }
      const clauses = filter.names.map(
        (name) => `[System.AssignedTo] = '${escapeWiqlString(name)}'`,
      );
      return `(${clauses.join(" OR ")})`;
    }
  }
}
