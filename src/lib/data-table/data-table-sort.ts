export type SortDirection = "asc" | "desc";

export type DataTableSortSpec<TField extends string = string> = {
  field: TField;
  direction: SortDirection;
};

export type DataTableSortOption<TField extends string = string> = {
  value: TField;
  label: string;
};

export type DataTableSortAccessors<TItem, TField extends string> = Record<
  TField,
  (item: TItem) => string | number
>;

function compareSortValues(left: string | number, right: string | number): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), "es", { sensitivity: "base" });
}

export function sortDataTableRows<TItem, TField extends string>(
  items: readonly TItem[],
  spec: DataTableSortSpec<TField> | null,
  accessors: DataTableSortAccessors<TItem, TField>,
): TItem[] {
  if (!spec) return [...items];

  const readValue = accessors[spec.field];
  if (!readValue) return [...items];

  const directionMultiplier = spec.direction === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    const compared = compareSortValues(readValue(left), readValue(right));
    if (compared !== 0) return compared * directionMultiplier;
    return 0;
  });
}

export function toggleSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}
