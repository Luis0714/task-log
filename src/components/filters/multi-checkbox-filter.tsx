"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterPresetRow } from "@/components/filters/filter-preset-row";
import { filterFieldTriggerClassName } from "@/components/filters/filter-field-trigger-classes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiCheckboxFilterOption = {
  value: string;
  label: ReactNode;
};

export type MultiCheckboxFilterPreset = {
  label: string;
  active: boolean;
  onSelect: () => void;
};

export type MultiCheckboxFilterProps = {
  id: string;
  label: string;
  options: MultiCheckboxFilterOption[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  triggerLabel: string;
  presets?: MultiCheckboxFilterPreset[];
  disabled?: boolean;
  className?: string;
};

export function MultiCheckboxFilter({
  id,
  label,
  options,
  selected,
  onSelectedChange,
  triggerLabel,
  presets = [],
  disabled = false,
  className,
}: MultiCheckboxFilterProps) {
  const selectedSet = new Set(selected);

  const toggleValue = (value: string, checked: boolean) => {
    if (checked) {
      onSelectedChange([...selected, value]);
      return;
    }
    onSelectedChange(selected.filter((item) => item !== value));
  };

  const showClear = selected.length > 0 && selected.length < options.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger
          id={id}
          disabled={disabled || options.length === 0}
          className={filterFieldTriggerClassName()}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] p-2" align="start">
          {presets.length > 0 ? (
            <div className="space-y-0.5">
              {presets.map((preset) => (
                <FilterPresetRow
                  key={preset.label}
                  label={preset.label}
                  active={preset.active}
                  onSelect={preset.onSelect}
                />
              ))}
            </div>
          ) : null}
          {presets.length > 0 && options.length > 0 ? (
            <div className="bg-border my-2 h-px" />
          ) : null}
          <div className="max-h-60 space-y-0.5 overflow-y-auto">
            {options.map((option) => {
              const checked = selectedSet.has(option.value);
              const optionId = `${id}-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    onCheckedChange={(next) =>
                      toggleValue(option.value, next === true)
                    }
                  />
                  <span className="min-w-0 flex-1 text-sm leading-tight">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
          {showClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 w-full text-xs"
              onClick={() => onSelectedChange([])}
            >
              Limpiar selección
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
