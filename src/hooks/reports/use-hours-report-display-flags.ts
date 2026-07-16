"use client";

import type { UseHoursReportReturn } from "@/hooks/reports/use-hours-report";

export type HoursReportDisplayFlags = Readonly<{
  showStale: boolean;
  showError: boolean;
  hasGenerated: boolean;
  showEmpty: boolean;
  showExport: boolean;
}>;

export function computeHoursReportDisplayFlags(
  hoursReport: UseHoursReportReturn,
): HoursReportDisplayFlags {
  const status = hoursReport.status;
  const result = hoursReport.result;
  const rowCount = result?.rows.length ?? 0;
  const hasGenerated = status === "ready" || status === "stale";

  return {
    showStale: status === "stale",
    showError: status === "error" || Boolean(hoursReport.errorMessage),
    hasGenerated,
    showEmpty: hasGenerated && result !== null && rowCount === 0,
    showExport: hasGenerated && rowCount > 0,
  };
}