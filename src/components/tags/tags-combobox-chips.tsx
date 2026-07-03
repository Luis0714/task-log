"use client";

import type {
  useComboboxAnchor} from "@/components/ui/combobox";
import {
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
} from "@/components/ui/combobox";
import { coerceTagComboboxSelectedItems } from "@/lib/tags/tag-combobox-option";

export type TagsComboboxChipsProps = {
  anchor: ReturnType<typeof useComboboxAnchor>;
  id?: string;
  placeholder: string;
  hasSelection: boolean;
  showChipRemove?: boolean;
};

export function TagsComboboxChips({
  anchor,
  id,
  placeholder,
  hasSelection,
  showChipRemove = true,
}: TagsComboboxChipsProps) {
  return (
    <ComboboxChips ref={anchor} className="w-full max-w-md">
      <ComboboxValue>
        {(selectedValue) => {
          const selectedItems = coerceTagComboboxSelectedItems(selectedValue);

          return selectedItems.map((item, index) => (
            <ComboboxChip
              key={`${item.value}-${index}`}
              showRemove={showChipRemove}
            >
              {item.label}
            </ComboboxChip>
          ));
        }}
      </ComboboxValue>
      <ComboboxChipsInput id={id} placeholder={hasSelection ? "" : placeholder} />
    </ComboboxChips>
  );
}
