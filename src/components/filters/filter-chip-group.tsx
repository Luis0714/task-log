"use client";

import { FilterChip } from "@/components/filters/filter-chip";
import { cn } from "@/lib/utils";

export type FilterChipOption = {
  value: string;
  label: string;
  dotClassName?: string;
};

export type FilterChipGroupProps = {
  options: readonly FilterChipOption[];
  className?: string;
} & (
  | {
      mode: "single";
      value: string;
      onValueChange: (value: string) => void;
    }
  | {
      mode: "multiple";
      value: readonly string[];
      onValueChange: (value: string[]) => void;
    }
);

export function FilterChipGroup(props: FilterChipGroupProps) {
  const { options, className } = props;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const selected =
          props.mode === "single"
            ? props.value === option.value
            : props.value.includes(option.value);

        return (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={selected}
            dotClassName={option.dotClassName}
            onSelect={() => {
              if (props.mode === "single") {
                props.onValueChange(option.value);
                return;
              }
              const next = selected
                ? props.value.filter((item) => item !== option.value)
                : [...props.value, option.value];
              props.onValueChange(next);
            }}
          />
        );
      })}
    </div>
  );
}
