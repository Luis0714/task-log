"use client";

import { deliveryChartConfig } from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

type TooltipPayloadItem = {
  dataKey?: string | number;
  value?: number | string;
};

export type DeliveryChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  className?: string;
};

export function DeliveryChartTooltip({
  active,
  payload,
  label,
  className,
}: DeliveryChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {label ? <p className="text-foreground font-medium">{label}</p> : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? "");
          const configItem =
            deliveryChartConfig[key as keyof typeof deliveryChartConfig];
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: `var(--color-${key})` }}
                  aria-hidden
                />
                <span className="text-muted-foreground">
                  {configItem?.label ?? key}
                </span>
              </span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
