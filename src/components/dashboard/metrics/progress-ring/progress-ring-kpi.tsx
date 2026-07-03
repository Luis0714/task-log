import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { PROGRESS_RING_PAIR_CELL_CLASS } from "@/components/dashboard/metrics/progress-ring/progress-ring-pair-grid";
import type { ProgressRingKpiViewModel } from "@/lib/dashboard/progress-ring/types";
import { cn } from "@/lib/utils";

export type ProgressRingKpiProps = {
  model: ProgressRingKpiViewModel;
  loading?: boolean;
  className?: string;
};

export function ProgressRingKpi({ model, loading = false, className }: ProgressRingKpiProps) {
  if (!model.visible) return null;

  return (
    <DashboardKpi
      size="featured"
      layout="stack"
      label={model.label}
      value={model.value}
      hint={model.hint}
      progress={model.progress}
      variant={model.variant}
      loading={loading}
      className={cn(PROGRESS_RING_PAIR_CELL_CLASS, className)}
    />
  );
}
