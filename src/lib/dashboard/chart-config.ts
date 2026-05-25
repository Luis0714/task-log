import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const CHART_HEIGHT_COMPACT = "h-[150px]";
/** Gráficas con etiquetas largas por día del sprint */
export const CHART_HEIGHT_DAILY = "h-[180px] sm:h-[200px]";
export const CHART_HEIGHT_DEFAULT = "h-[180px]";
export const CHART_HEIGHT_INLINE = "h-[120px]";

export const CHART_MARGIN = { top: 12, right: 8, left: -18, bottom: 0 } as const;

export const CHART_INITIAL_DIMENSION = { width: 320, height: 150 } as const;

export const CHART_TOOLTIP_CURSOR = {
  fill: "hsl(var(--muted))",
  opacity: 0.25,
} as const;

/** Anula aspect-video del contenedor shadcn para altura fija coherente */
export function chartContainerClass(heightClass?: string, className?: string): string {
  return cn("aspect-auto min-h-0 w-full", heightClass, className);
}

export const deliveryChartConfig = {
  pending: { label: "Pendiente", color: "var(--chart-3)" },
  inProgress: { label: "En curso", color: "var(--chart-1)" },
  completed: { label: "Completado", color: "var(--chart-2)" },
} satisfies ChartConfig;

export const hoursTrendChartConfig = {
  cumulativeHours: { label: "Acumulado", color: "var(--chart-1)" },
  idealCumulativeHours: { label: "Ritmo ideal", color: "var(--chart-5)" },
} satisfies ChartConfig;

export const hoursDailyChartConfig = {
  taskHours: { label: "Tasks", color: "var(--chart-1)" },
  bugHours: { label: "Bugs", color: "var(--chart-4)" },
} satisfies ChartConfig;

export const hoursMixChartConfig = {
  taskHours: { label: "Tasks", color: "var(--chart-1)" },
  bugHours: { label: "Bugs", color: "var(--chart-4)" },
} satisfies ChartConfig;

export const pbiStateChartConfig = {
  count: { label: "PBIs", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const pbiProgressChartConfig = {
  completed: { label: "Completado", color: "var(--chart-1)" },
  remaining: {
    label: "Restante",
    theme: { light: "hsl(var(--muted))", dark: "hsl(var(--muted))" },
  },
} satisfies ChartConfig;
