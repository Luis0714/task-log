import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

import { WorkItemSelectOption } from "@/components/time-log/work-item-select-option";

export type PbiSummaryCardProps = {
  pbi: AdoWorkItemOptionDto;
  title?: string;
};

export function PbiSummaryCard({ pbi, title = "Historia seleccionada" }: PbiSummaryCardProps) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {title}
      </p>
      <WorkItemSelectOption item={pbi} variant="menu" />
    </div>
  );
}
