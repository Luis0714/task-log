import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export function readAssigneeFromSearchParams(
  searchParams: Pick<URLSearchParams, "entries">,
): string {
  const sp = parseAdoContextSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  return sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;
}

/** Prioriza la URL; usa el valor local mientras la navegación está en curso. */
export function resolveAssigneeForUi(
  assigneeFromUrl: string,
  localAssignee: string,
): string {
  if (
    assigneeFromUrl !== localAssignee &&
    localAssignee !== DEFAULT_WORK_ITEM_FILTERS.assignee
  ) {
    return localAssignee;
  }
  return assigneeFromUrl;
}
