"use client";

import { useMemo } from "react";

import { TagsComboboxField } from "@/components/tags/tags-combobox-field";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveTagComboboxSelection, type TagComboboxOption } from "@/lib/tags/tag-combobox-option";
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

  return (
    <TagsComboboxField
      label={label}
      id={id}
      className={className}
      isDisabled={disabled || options.length === 0}
      options={options}
      multiple={multiple}
      selectedOptions={selectedOptions}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      onValueChange={onValueChange}
    />
  );
}
