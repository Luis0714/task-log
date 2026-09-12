export const LINKABLE_WORK_ITEM_KINDS = ["pbi", "bug", "task"] as const;

export type LinkableWorkItemKind = (typeof LINKABLE_WORK_ITEM_KINDS)[number];

export type LinkableWorkItemDto = {
  id: number;
  title: string;
  type: string;
  kind: LinkableWorkItemKind;
  state: string;
  description: string;
};
