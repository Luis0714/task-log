import type { ChartConfig } from "@/components/ui/chart";
import {
  BUG_CHART_ATTENDED_COLOR,
  BUG_CHART_OPEN_COLOR,
} from "@/lib/brand/bug-colors";
import { cn } from "@/lib/utils";

export const CHART_HEIGHT_COMPACT = "h-[150px]";
/** Gráficas con etiquetas largas por día del sprint */
export const CHART_HEIGHT_DAILY = "h-[180px] sm:h-[200px]";
export const CHART_HEIGHT_DEFAULT = "h-[180px]";
export const CHART_HEIGHT_INLINE = "h-[120px]";
export const CHART_WIDTH_INLINE_RING = "w-[100px]";

/** Contenedor cuadrado del anillo de progreso (evita recorte con overflow-hidden en Card) */
export const PROGRESS_RING_CHART_SIZE_CLASS =
  "size-[96px] shrink-0 sm:size-[104px] md:size-[120px]";

/** @deprecated Usar PROGRESS_RING_CHART_SIZE_CLASS */
export const PROGRESS_RING_CHART_RESPONSIVE_CLASS = PROGRESS_RING_CHART_SIZE_CLASS;

/** Radios en % para que el anillo escale con ResponsiveContainer */
export const PROGRESS_RING_PIE = {
  innerRadius: "62%",
  outerRadius: "88%",
  paddingAngle: 4,
  cornerRadius: 5,
  strokeWidth: 2,
  stroke: "hsl(var(--background))",
  animationDuration: 700,
} as const;

/** Anillo compacto compartido (mezcla horas, progreso PBI, etc.) */
export const INLINE_PIE_RING = {
  innerRadius: 34,
  outerRadius: 48,
  paddingAngle: 4,
  cornerRadius: 5,
  strokeWidth: 2,
  stroke: "hsl(var(--background))",
  animationDuration: 700,
} as const;

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
  inProgress: { label: "En progreso", color: "var(--chart-4)" },
  completed: { label: "Completado", color: BUG_CHART_ATTENDED_COLOR },
} satisfies ChartConfig;

export const hoursTrendChartConfig = {
  cumulativeHours: { label: "Acumulado", color: "var(--chart-1)" },
  idealCumulativeHours: { label: "Ritmo ideal", color: "var(--chart-5)" },
} satisfies ChartConfig;

/** Segmento vacío en barras apiladas (0 h de bugs o día sin registro). */
export const CHART_EMPTY_SEGMENT_COLOR = "var(--muted-foreground)";

export const hoursDailyChartConfig = {
  taskHours: { label: "Tareas", color: "var(--chart-1)" },
  bugHours: { label: "Bugs", color: BUG_CHART_OPEN_COLOR },
} satisfies ChartConfig;

export const hoursMixChartConfig = {
  taskHours: { label: "Tareas", color: "var(--chart-1)" },
  bugHours: { label: "Bugs", color: BUG_CHART_OPEN_COLOR },
} satisfies ChartConfig;

export const pbiStateChartConfig = {
  count: { label: "Historias", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const pbiProgressChartConfig = {
  completed: { label: "Completado", color: "var(--chart-1)" },
  remaining: { label: "Restante", color: "var(--muted)" },
} satisfies ChartConfig;
