import type { ChartConfig } from "@/components/ui/chart";

export const CHART_HEIGHT_COMPACT = "h-[150px]";
export const CHART_HEIGHT_DEFAULT = "h-[180px]";
export const CHART_HEIGHT_INLINE = "h-[120px]";

export const deliveryChartConfig = {
  pending: { label: "Pendiente", color: "var(--chart-3)" },
  inProgress: { label: "En curso", color: "var(--chart-2)" },
  completed: { label: "Completado", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const hoursTrendChartConfig = {
  cumulativeHours: { label: "Acumulado", color: "var(--chart-1)" },
  idealCumulativeHours: { label: "Ritmo ideal", color: "var(--chart-5)" },
  gap: { label: "Desfase", color: "var(--chart-4)" },
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
