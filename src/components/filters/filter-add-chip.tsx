"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export type FilterAddChipProps = {
  label?: string;
  onClick?: () => void;
  className?: string;
};

export function FilterAddChip({
  label = "Añadir",
  onClick,
  className,
}: FilterAddChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-muted-foreground inline-flex h-8 items-center gap-1 rounded-full border border-dashed px-3 text-xs font-medium",
        "hover:bg-muted/60 hover:text-foreground",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <Plus className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
