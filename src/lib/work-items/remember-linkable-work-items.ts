import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export function resolveRememberedWorkItems(
  knownItems: readonly LinkableWorkItemDto[],
  catalog: readonly LinkableWorkItemDto[],
  ids: readonly string[],
): LinkableWorkItemDto[] {
  return ids.flatMap((id) => {
    const match =
      knownItems.find((item) => String(item.id) === id) ??
      catalog.find((item) => String(item.id) === id);
    return match ? [match] : [];
  });
}
