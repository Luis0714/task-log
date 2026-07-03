import {
  DEFAULT_WORK_ITEM_FILTERS,
  isWorkItemAssigneeDefault,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";

export function countActiveWorkItemFilters(
  filters: WorkItemFilters = DEFAULT_WORK_ITEM_FILTERS,
): number {
  let count = 0;
  if (filters.search.trim().length > 0) count++;
  if (filters.states.length > 0) count++;
  if (!isWorkItemAssigneeDefault(filters.assignee)) count++;
  return count;
}

export type BuildAdoFiltersSummaryParams = {
  project?: string;
  team?: string;
  sprintLabel?: string | null;
  workItemFilters?: WorkItemFilters;
  filteredCount?: number;
  totalCount?: number;
  extraParts?: string[];
};

export function buildAdoFiltersSummary({
  project,
  team,
  sprintLabel,
  workItemFilters,
  filteredCount,
  totalCount,
  extraParts = [],
}: BuildAdoFiltersSummaryParams): string {
  const parts: string[] = [];

  if (project) parts.push(project);
  if (team) parts.push(team);
  if (sprintLabel) parts.push(sprintLabel);

  if (workItemFilters) {
    const active = countActiveWorkItemFilters(workItemFilters);
    if (active > 0) {
      parts.push(`${active} filtro${active === 1 ? "" : "s"} activo${active === 1 ? "" : "s"}`);
    }
  }

  parts.push(...extraParts.filter((part) => part.trim().length > 0));

  if (
    totalCount !== undefined &&
    totalCount > 0 &&
    filteredCount !== undefined
  ) {
    parts.push(`${filteredCount} de ${totalCount}`);
  }

  return parts.join(" · ") || "Configurar filtros";
}
