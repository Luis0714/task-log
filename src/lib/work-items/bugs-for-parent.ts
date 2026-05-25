import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export function filterBugsForParent(
  bugs: readonly AdoWorkItemOptionDto[],
  parentId: number,
): AdoWorkItemOptionDto[] {
  return bugs.filter((bug) => bug.parentId === parentId);
}
