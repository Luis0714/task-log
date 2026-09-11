"use client";

import { LinkableWorkItemRow } from "@/components/work-items/linkable-work-item-row";
import {
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { groupLinkableWorkItemsByKind } from "@/lib/work-items/group-linkable-work-items";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export type LinkableWorkItemsPopupProps = {
  items: readonly LinkableWorkItemDto[];
  searchPlaceholder: string;
  emptyMessage: string;
};

export function LinkableWorkItemsPopup({
  items,
  searchPlaceholder,
  emptyMessage,
}: LinkableWorkItemsPopupProps) {
  const groups = groupLinkableWorkItemsByKind(items);

  return (
    <ComboboxContent className="min-w-(--anchor-width)">
      <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
      <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      <ComboboxList>
        {groups.map((group) => (
          <ComboboxGroup key={group.kind} items={group.items}>
            <ComboboxLabel>{group.label}</ComboboxLabel>
            <ComboboxCollection>
              {(item: LinkableWorkItemDto) => (
                <ComboboxItem
                  key={item.id}
                  value={item}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <LinkableWorkItemRow item={item} />
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>
        ))}
      </ComboboxList>
    </ComboboxContent>
  );
}
