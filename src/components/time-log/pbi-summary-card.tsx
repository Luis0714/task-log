import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

import { WorkItemSelectOption } from "@/components/time-log/work-item-select-option";

export type PbiSummaryCardProps = {
  pbi: AdoWorkItemOptionDto;
  title?: string;
};

export function PbiSummaryCard({ pbi, title = "Historia seleccionada" }: PbiSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
        {title}
      </p>
      <WorkItemSelectOption item={pbi} variant="menu" />
    </div>
  );
}
