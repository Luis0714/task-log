import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type {
  DataTableSortOption,
  DataTableSortSpec,
} from "@/lib/data-table/data-table-sort";

export type SprintSortField = "createdAt" | "workingDate" | "parentTitle";

export const DEFAULT_SPRINT_ITEMS_SORT: DataTableSortSpec<SprintSortField> = {
  field: "createdAt",
  direction: "desc",
};

export const SPRINT_SORT_OPTIONS: readonly DataTableSortOption<SprintSortField>[] = [
  { value: "createdAt", label: "Fecha de creación" },
  { value: "workingDate", label: "Fecha de trabajo" },
  { value: "parentTitle", label: "Nombre HU padre" },
];

export function filterSprintItemsByNameSearch(
  items: readonly AdoWorkItemOptionDto[],
  search: string,
): AdoWorkItemOptionDto[] {
  const q = search.trim().toLowerCase();
  if (!q) return items as AdoWorkItemOptionDto[];
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.parentTitle?.toLowerCase().includes(q) ?? false),
  );
}

export function sortSprintItems(
  items: readonly AdoWorkItemOptionDto[],
  sort: DataTableSortSpec<SprintSortField>,
): AdoWorkItemOptionDto[] {
  const dir = sort.direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    let compared = 0;

    switch (sort.field) {
      case "createdAt":
        // ADO work item IDs are auto-incrementing: higher ID = more recently created.
        compared = a.id - b.id;
        break;

      case "workingDate": {
        const aDate = a.workingDate ?? "";
        const bDate = b.workingDate ?? "";
        if (!aDate && !bDate) break;
        if (!aDate) return 1;
        if (!bDate) return -1;
        compared = aDate.localeCompare(bDate);
        break;
      }

      case "parentTitle": {
        const aParent = a.parentTitle ?? "";
        const bParent = b.parentTitle ?? "";
        if (!aParent && !bParent) break;
        if (!aParent) return 1;
        if (!bParent) return -1;
        compared = aParent.localeCompare(bParent, "es", { sensitivity: "base" });
        break;
      }
    }

    if (compared !== 0) return compared * dir;
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });
}
