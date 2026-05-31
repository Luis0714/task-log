"use client";

import {
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { TagComboboxOption } from "@/lib/tags/tag-combobox-option";

export type TagsComboboxPopupProps = {
  anchor: ReturnType<typeof useComboboxAnchor>;
  searchPlaceholder: string;
  emptyMessage: string;
};

export function TagsComboboxPopup({
  anchor,
  searchPlaceholder,
  emptyMessage,
}: TagsComboboxPopupProps) {
  return (
    <ComboboxContent anchor={anchor}>
      <ComboboxInput placeholder={searchPlaceholder} showTrigger={false} />
      <ComboboxList>
        <ComboboxCollection>
          {(item: TagComboboxOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxCollection>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      </ComboboxList>
    </ComboboxContent>
  );
}
