"use client";

import { useMemo } from "react";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  coerceTagComboboxSelectedItems,
  extractTagComboboxValues,
  resolveTagComboboxSelection,
  type TagComboboxOption,
} from "@/lib/tags/tag-combobox-option";
import { cn } from "@/lib/utils";

export type TagsComboboxProps = {
  options: readonly TagComboboxOption[];
  value: readonly string[];
  onValueChange: (values: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function TagsCombobox({
  options,
  value,
  onValueChange,
  multiple = true,
  disabled = false,
  loading = false,
  label,
  id,
  placeholder = "Selecciona tags…",
  searchPlaceholder = "Buscar tag…",
  emptyMessage = "No se encontraron tags.",
  className,
}: TagsComboboxProps) {
  const selectedOptions = useMemo(
    () => resolveTagComboboxSelection(options, value),
    [options, value],
  );

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {label ? <Label htmlFor={id}>{label}</Label> : null}
        <Skeleton className="h-9 w-full max-w-md" />
      </div>
    );
  }

  const isDisabled = disabled || options.length === 0;

  if (multiple) {
    return (
      <TagsComboboxField
        label={label}
        id={id}
        className={className}
        isDisabled={isDisabled}
        options={options}
        selectedOptions={selectedOptions}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        onValueChange={onValueChange}
      />
    );
  }

  return (
    <TagsComboboxFieldSingle
      label={label}
      id={id}
      className={className}
      isDisabled={isDisabled}
      options={options}
      selectedOption={selectedOptions[0] ?? null}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      onValueChange={onValueChange}
    />
  );
}

type TagsComboboxFieldBaseProps = {
  label?: string;
  id?: string;
  className?: string;
  isDisabled: boolean;
  options: readonly TagComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  onValueChange: (values: string[]) => void;
};

function TagsComboboxPopup({
  anchor,
  searchPlaceholder,
  emptyMessage,
}: {
  anchor: ReturnType<typeof useComboboxAnchor>;
  searchPlaceholder: string;
  emptyMessage: string;
}) {
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

function TagsComboboxChips({
  anchor,
  id,
  placeholder,
  hasSelection,
}: {
  anchor: ReturnType<typeof useComboboxAnchor>;
  id?: string;
  placeholder: string;
  hasSelection: boolean;
}) {
  return (
    <ComboboxChips ref={anchor} className="w-full max-w-md">
      <ComboboxValue>
        {(selectedValue) => {
          const selectedItems = coerceTagComboboxSelectedItems(selectedValue);

          return selectedItems.map((item, index) => (
            <ComboboxChip key={`${item.value}-${index}`}>{item.label}</ComboboxChip>
          ));
        }}
      </ComboboxValue>
      <ComboboxChipsInput id={id} placeholder={hasSelection ? "" : placeholder} />
    </ComboboxChips>
  );
}

function TagsComboboxField({
  label,
  id,
  className,
  isDisabled,
  options,
  selectedOptions,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onValueChange,
}: TagsComboboxFieldBaseProps & {
  selectedOptions: TagComboboxOption[];
}) {
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
          onValueChange(extractTagComboboxValues(nextValue));
        }}
      >
        <TagsComboboxChips
          anchor={anchor}
          id={id}
          placeholder={placeholder}
          hasSelection={selectedOptions.length > 0}
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

function TagsComboboxFieldSingle({
  label,
  id,
  className,
  isDisabled,
  options,
  selectedOption,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onValueChange,
}: TagsComboboxFieldBaseProps & {
  selectedOption: TagComboboxOption | null;
}) {
  const anchor = useComboboxAnchor();

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}

      <Combobox
        items={options}
        value={selectedOption}
        disabled={isDisabled}
        onValueChange={(nextValue) => {
          onValueChange(extractTagComboboxValues(nextValue));
        }}
      >
        <TagsComboboxChips
          anchor={anchor}
          id={id}
          placeholder={placeholder}
          hasSelection={Boolean(selectedOption)}
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
