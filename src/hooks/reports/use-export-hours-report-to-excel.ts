"use client";

import { useCallback, useState } from "react";

import type { UseHoursReportReturn } from "@/hooks/reports/use-hours-report";
import type { HoursReportRequestSchema } from "@/lib/schemas/reports-hours";
import { appToast } from "@/lib/toast";

export type UseExportHoursReportToExcelParams = Readonly<{
  hoursReport: UseHoursReportReturn;
  payload: HoursReportRequestSchema;
  allPersons: readonly string[];
  hiddenPersons: ReadonlySet<string>;
}>;

export function useExportHoursReportToExcel({
  hoursReport,
  payload,
  allPersons,
  hiddenPersons,
}: UseExportHoursReportToExcelParams) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const exportExcel = useCallback(async () => {
    if (hoursReport.status === "stale") {
      appToast.warning("El reporte está desactualizado. Regenera antes de exportar.");
      return;
    }
    if (!hoursReport.result || hoursReport.result.rows.length === 0) {
      appToast.warning("No hay datos para exportar.");
      return;
    }
    setDownloadingExcel(true);
    try {
      await hoursReport.downloadExcel({
        ...payload,
        hiddenPersons: allPersons.filter((person) => hiddenPersons.has(person)),
      });
    } finally {
      setDownloadingExcel(false);
    }
  }, [hoursReport, payload, allPersons, hiddenPersons]);

  return { exportExcel, downloadingExcel };
}