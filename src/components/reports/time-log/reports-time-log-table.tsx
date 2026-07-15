import { StickyTable } from "@/components/ui/sticky-table";
import { REPORTS_TIME_LOG_COLUMNS } from "@/components/reports/time-log/reports-time-log-columns";
import { ReportsTimeLogRowCard } from "@/components/reports/time-log/reports-time-log-row-card";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

export { ReportsTimeLogTableSkeleton } from "./reports-time-log-table-skeleton";

export type ReportsTimeLogTableProps = {
  rows: readonly HoursReportRow[];
};

export function ReportsTimeLogTable({ rows }: Readonly<ReportsTimeLogTableProps>) {
  return (
    <StickyTable
      columns={REPORTS_TIME_LOG_COLUMNS}
      rows={rows}
      getRowKey={(row, idx) =>
        `${row.projectId}-${row.teamId ?? "none"}-${row.personDisplayName}-${idx}`
      }
      tableClassName="min-w-[145rem]"
      rowClassName="border-b last:border-b-0"
      renderCard={(row) => <ReportsTimeLogRowCard row={row} />}
    />
  );
}
