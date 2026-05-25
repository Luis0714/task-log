"use client";

import { deliveryChartConfig } from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

/** Orden del flujo: pendiente → en curso → completado */
const LEGEND_KEYS = ["pending", "inProgress", "completed"] as const;

export type DeliveryChartLegendProps = {
  className?: string;
};

export function DeliveryChartLegend({ className }: DeliveryChartLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3",
        className,
      )}
    >
      {LEGEND_KEYS.map((key) => {
        const item = deliveryChartConfig[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: `var(--color-${key})` }}
              aria-hidden
            />
            <span className="text-muted-foreground text-xs">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
