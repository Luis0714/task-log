"use client";

import { Label } from "@/components/ui/label";
import {
  Combobox,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { TagsComboboxChips } from "@/components/tags/tags-combobox-chips";
import { TagsComboboxPopup } from "@/components/tags/tags-combobox-popup";
import {
  extractTagComboboxValues,
  type TagComboboxOption,
} from "@/lib/tags/tag-combobox-option";
import { cn } from "@/lib/utils";

export type TagsComboboxFieldProps = {
  label?: string;
  id?: string;
  className?: string;
  isDisabled: boolean;
  options: readonly TagComboboxOption[];
  multiple: boolean;
  selectedOptions: TagComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  onValueChange: (values: string[]) => void;
};

export function TagsComboboxField({
  label,
  id,
  className,
  isDisabled,
  options,
  multiple,
  selectedOptions,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onValueChange,
}: TagsComboboxFieldProps) {
  const anchor = useComboboxAnchor();

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}

      <Combobox
        multiple
        items={options}
        value={selectedOptions}
        disabled={isDisabled}
        onValueChange={(nextValue) => {
          const values = extractTagComboboxValues(nextValue);
          onValueChange(multiple ? values : values.slice(-1));
        }}
      >
        <TagsComboboxChips
          anchor={anchor}
          id={id}
          placeholder={placeholder}
          hasSelection={selectedOptions.length > 0}
          showChipRemove={multiple}
        />
        <TagsComboboxPopup
          anchor={anchor}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
        />
      </Combobox>
    </div>
  );
}
