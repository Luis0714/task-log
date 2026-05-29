import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import type { DashboardHeaderData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type DashboardHeaderRowProps = {
  data: DashboardHeaderData;
  actions?: ReactNode;
  className?: string;
};

export function DashboardHeaderRow({
  data,
  actions,
  className,
}: DashboardHeaderRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <DashboardHeader data={data} className="min-w-0 flex-1" />
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
