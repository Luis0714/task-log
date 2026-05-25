"use client";

import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ConfigChartLegendProps = {
  config: ChartConfig;
  keys: readonly string[];
  className?: string;
};

export function ConfigChartLegend({ config, keys, className }: ConfigChartLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3",
        className,
      )}
    >
      {keys.map((key) => {
        const item = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: `var(--color-${key})` }}
              aria-hidden
            />
            <span className="text-muted-foreground text-xs">{item?.label ?? key}</span>
          </div>
        );
      })}
    </div>
  );
}
