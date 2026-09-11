import type {
  LinkableWorkItemDto,
  LinkableWorkItemKind,
} from "@/lib/work-items/linkable-work-item";

export type LinkableWorkItemGroup = {
  kind: LinkableWorkItemKind;
  label: string;
  items: LinkableWorkItemDto[];
};

const KIND_GROUPS: ReadonlyArray<{ kind: LinkableWorkItemKind; label: string }> = [
  { kind: "pbi", label: "Historias" },
  { kind: "task", label: "Tareas" },
  { kind: "bug", label: "Bugs" },
];

export function groupLinkableWorkItemsByKind(
  items: readonly LinkableWorkItemDto[],
): LinkableWorkItemGroup[] {
  return KIND_GROUPS.map((group) => ({
    kind: group.kind,
    label: group.label,
    items: items.filter((item) => item.kind === group.kind),
  })).filter((group) => group.items.length > 0);
}
