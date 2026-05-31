"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export type SegmentedControlItem<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  fullWidth?: boolean;
  size?: "default" | "sm";
};

export function SegmentedControl<T extends string = string>({
  items,
  value,
  onValueChange,
  ariaLabel,
  className,
  fullWidth = false,
  size = "default",
}: SegmentedControlProps<T>) {
  const baseId = useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-full bg-muted/80 p-1 ring-1 ring-border/60",
        fullWidth && "grid w-full",
        !fullWidth && "w-fit",
        className,
      )}
      style={
        fullWidth
          ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {items.map((item) => {
        const isSelected = value === item.value;
        const tabId = `${baseId}-${item.value}`;

        return (
          <button
            key={item.value}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative rounded-full font-medium transition-all outline-none select-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-50",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              fullWidth && "w-full",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
