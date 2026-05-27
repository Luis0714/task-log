import type { SprintStatusOverview, WorkItemStatusCounts } from "@/lib/dashboard/types";

export type DeliveryChartRow = {
  key: string;
  label: string;
  pending: number;
  inProgress: number;
  completed: number;
};

function toRow(key: string, label: string, counts: WorkItemStatusCounts): DeliveryChartRow {
  return {
    key,
    label,
    pending: counts.pending,
    inProgress: counts.inProgress,
    completed: counts.completed,
  };
}

export function buildDeliveryChartRows(overview: SprintStatusOverview): DeliveryChartRow[] {
  return [
    toRow("userStories", "Historias", overview.userStories),
    toRow("bugs", "Bugs", overview.bugs),
  ];
}

export function completionPercent(counts: WorkItemStatusCounts): number {
  if (counts.assigned <= 0) return 0;
  return Math.round((counts.completed / counts.assigned) * 100);
}
