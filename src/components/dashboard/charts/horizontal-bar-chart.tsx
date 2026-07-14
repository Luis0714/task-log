"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, XAxis, YAxis } from "recharts";
import type { BarShapeProps } from "recharts";

import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import {
  CHART_TOOLTIP_CURSOR,
  chartContainerClass,
  pbiStateChartConfig,
} from "@/lib/dashboard/chart-config";
import { useCurrentProject } from "@/hooks/use-current-project";
import { useBacklogItemStates } from "@/hooks/work-items/use-backlog-item-states";
import { getStateChartColor } from "@/lib/work-items/pbi-state-colors";

type ItemsTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: PbiStateBar }>;
};

function ItemsTooltip({ active, payload }: Readonly<ItemsTooltipProps>) {
  if (!active || !payload?.length) return null;
  const bar = payload[0]?.payload;
  if (!bar) return null;
  return (
    <div className="min-w-48 max-w-72 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">
        {bar.state} · {bar.count}
      </p>
      {bar.items.length > 0 && (
        <ul className="space-y-0.5">
          {bar.items.map((item) => (
            <li key={item.id} className="truncate text-muted-foreground">
              <span className="font-mono text-[10px] text-foreground/50">#{item.id}</span>{" "}
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const MARGIN = { top: 12, right: 28, left: 2, bottom: 0 } as const;

function resolveBarFillOpacity(
  isDimmed: boolean,
  isLead: boolean,
  isSelected: boolean,
): number {
  if (isDimmed) return 0.35;
  if (isLead || isSelected) return 1;
  return 0.88;
}

function resolveBarStroke(isSelected: boolean, isLead: boolean, fill: string): string {
  if (isSelected) return fill;
  if (isLead) return fill;
  return "transparent";
}

function resolveBarStrokeWidth(isSelected: boolean, isLead: boolean): number {
  if (isSelected) return 2;
  if (isLead) return 1.5;
  return 0;
}

function makePbiBarShape(
  selectedBarKeys: readonly string[] | null,
  maxCount: number,
  lookup: (state: string) => string,
) {
  return function PbiBarShape(props: BarShapeProps) {
    const bar = (props as { payload?: PbiStateBar }).payload;
    if (!bar) return <Rectangle {...props} />;
    const isLead = bar.count === maxCount && maxCount > 0;
    const hasSelection = selectedBarKeys != null && selectedBarKeys.length > 0;
    const isSelected = hasSelection && selectedBarKeys.includes(bar.state);
    const isDimmed = hasSelection && !isSelected;
    const fill = lookup(bar.state);
    return (
      <Rectangle
        {...props}
        fill={fill}
        fillOpacity={resolveBarFillOpacity(isDimmed, isLead, isSelected)}
        stroke={resolveBarStroke(isSelected, isLead, fill)}
        strokeWidth={resolveBarStrokeWidth(isSelected, isLead)}
      />
    );
  };
}

export type HorizontalBarChartProps = Readonly<{
  bars: readonly PbiStateBar[];
  className?: string;
  selectedBarKeys?: readonly string[] | null;
  onBarClick?: (bar: PbiStateBar) => void;
  tooltipValueLabel?: string;
  /** Muestra los títulos de los work items en el tooltip en lugar del conteo. */
  showItemsInTooltip?: boolean;
  /**
   * Función que resuelve el color (hex con `#`) de un estado.
   * Default: usa los estados de PBI del proyecto activo desde Azure.
   * Pasa uno propio si el chart muestra estados de otro work item type
   * (p. ej. bugs → `useBugStates`).
   */
  stateColorLookup?: (state: string) => string;
}>;

export function HorizontalBarChart({
  bars,
  className,
  selectedBarKeys = null,
  onBarClick,
  tooltipValueLabel = "historias de usuario",
  showItemsInTooltip = false,
  stateColorLookup,
}: HorizontalBarChartProps) {
  const project = useCurrentProject();
  const { states } = useBacklogItemStates(project);
  const lookup = stateColorLookup ?? ((state: string) => getStateChartColor(states, state));
  if (bars.length === 0) return null;

  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const chartHeight = Math.min(220, Math.max(150, bars.length * 28 + 24));
  const barShape = makePbiBarShape(selectedBarKeys, maxCount, lookup);

  return (
    <ChartContainer
      config={pbiStateChartConfig}
      className={chartContainerClass(undefined, className)}
      style={{ height: chartHeight }}
    >
      <BarChart data={[...bars]} layout="vertical" margin={MARGIN} barCategoryGap="14%">
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis type="number" hide domain={[0, maxCount]} />
        <YAxis
          type="category"
          dataKey="state"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={CHART_TOOLTIP_CURSOR}
          content={
            showItemsInTooltip ? (
              <ItemsTooltip />
            ) : (
              <ConfigChartTooltip
                config={pbiStateChartConfig}
                formatValue={(value) => {
                  const count = Number(value);
                  const label =
                    count === 1 ? tooltipValueLabel.replace(/s$/, "") : tooltipValueLabel;
                  return `${value} ${label}`;
                }}
              />
            )
          }
        />
        <Bar
          dataKey="count"
          name="count"
          maxBarSize={14}
          radius={[0, 5, 5, 0]}
          animationDuration={700}
          cursor={onBarClick ? "pointer" : undefined}
          onClick={(barData) => {
            const payload = (barData as { payload?: PbiStateBar }).payload;
            if (payload) onBarClick?.(payload);
          }}
          shape={barShape}
        >
          <LabelList
            dataKey="count"
            position="right"
            className="fill-foreground text-[10px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}