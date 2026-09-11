import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

const KIND_SEARCH_LABEL = {
  pbi: "HU historia",
  bug: "Bug",
  task: "Tarea",
} as const;

export function linkableWorkItemSearchLabel(item: LinkableWorkItemDto): string {
  return `#${item.id} ${item.title} ${KIND_SEARCH_LABEL[item.kind]}`;
}

export function filterLinkableWorkItems(
  items: readonly LinkableWorkItemDto[],
  query: string,
): LinkableWorkItemDto[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...items];

  return items.filter((item) => {
    const haystack = linkableWorkItemSearchLabel(item).toLowerCase();
    return haystack.includes(normalized);
  });
}

export function linkableWorkItemSelectedLabel(item: LinkableWorkItemDto): string {
  return `${item.type} ${item.id}: ${item.title}`;
}

export function addedWorkItemId(
  previousIds: readonly string[],
  nextIds: readonly string[],
): string | undefined {
  return nextIds.find((id) => !previousIds.includes(id));
}
