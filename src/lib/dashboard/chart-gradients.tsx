import {
  BUG_CHART_ATTENDED_COLOR,
  BUG_CHART_OPEN_COLOR,
} from "@/lib/brand/bug-colors";

/** IDs y stops reutilizables para barras con degradado vertical (más intenso arriba). */

export type BarGradientStop = {
  id: string;
  top: string;
  bottom: string;
};

export const DELIVERY_GRADIENTS: BarGradientStop[] = [
  { id: "grad-pending", top: "var(--chart-3)", bottom: "var(--chart-3)" },
  { id: "grad-inProgress", top: "var(--chart-4)", bottom: "var(--chart-4)" },
  {
    id: "grad-completed",
    top: BUG_CHART_ATTENDED_COLOR,
    bottom: BUG_CHART_ATTENDED_COLOR,
  },
];

export const HOURS_TASK_GRADIENT: BarGradientStop = {
  id: "grad-taskHours",
  top: "var(--chart-1)",
  bottom: "var(--chart-1)",
};

export const HOURS_BUG_GRADIENT: BarGradientStop = {
  id: "grad-bugHours",
  top: BUG_CHART_OPEN_COLOR,
  bottom: BUG_CHART_OPEN_COLOR,
};

export function workflowBarGradient(index: number, total: number): BarGradientStop {
  const ratio = total <= 1 ? 1 : index / (total - 1);
  const color =
    ratio >= 0.85 ? "var(--chart-1)" : ratio >= 0.5 ? "var(--chart-2)" : "var(--chart-3)";
  return { id: `grad-pbi-${index}`, top: color, bottom: color };
}

type GradientDefsProps = {
  gradients: readonly BarGradientStop[];
};

export function ChartGradientDefs({ gradients }: GradientDefsProps) {
  return (
    <defs>
      {gradients.map((g) => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={g.top} stopOpacity={1} />
          <stop offset="100%" stopColor={g.bottom} stopOpacity={0.4} />
        </linearGradient>
      ))}
    </defs>
  );
}

export function gradientFill(id: string): string {
  return `url(#${id})`;
}
