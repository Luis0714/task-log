"use client";

import { cn } from "@/lib/utils";

export type FilterPresetRowProps = {
  label: string;
  active: boolean;
  onSelect: () => void;
};

export function FilterPresetRow({ label, active, onSelect }: FilterPresetRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "hover:bg-muted/60 flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm",
        active && "bg-muted/50 font-medium",
      )}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
