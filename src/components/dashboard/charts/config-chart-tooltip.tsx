"use client";

import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type TooltipPayloadItem = {
  dataKey?: string | number;
  value?: number | string;
};

export type ConfigChartTooltipProps = {
  config: ChartConfig;
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatValue?: (value: number, key: string) => string;
  className?: string;
};

export function ConfigChartTooltip({
  config,
  active,
  payload,
  label,
  formatValue,
  className,
}: ConfigChartTooltipProps) {
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
          const configItem = config[key];
          const numericValue = Number(item.value);
          const displayValue = formatValue
            ? formatValue(Number.isFinite(numericValue) ? numericValue : 0, key)
            : item.value;

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
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
