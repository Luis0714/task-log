"use client";

import { cn } from "@/lib/utils";

export type FilterChipProps = Readonly<{
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  dotClassName?: string;
}>;

export function FilterChip({
  label,
  selected = false,
  onSelect,
  className,
  dotClassName,
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        selected
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      {dotClassName ? (
        <span className={cn("size-1.5 rounded-full", dotClassName)} aria-hidden />
      ) : null}
      {label}
    </button>
  );
}
