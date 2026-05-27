"use client";

import { cn } from "@/lib/utils";
import { HISTORY_FILTER_OPTIONS, type HistoryFilterRange } from "@/hooks/use-history-filter";

type Props = {
  selected: HistoryFilterRange;
  onSelect: (range: HistoryFilterRange) => void;
};

export function HistoryFilterChips({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar historial por rango">
      {HISTORY_FILTER_OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            selected === value
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground",
          )}
          aria-pressed={selected === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
