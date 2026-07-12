"use client";

import { useCallback, useMemo, useState } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { ReportsTimeLogAlerts } from "@/components/reports/time-log/reports-time-log-alerts";
import { ReportsTimeLogEmptyState } from "@/components/reports/time-log/reports-time-log-empty-state";
import { ReportsTimeLogExportDialog } from "@/components/reports/time-log/reports-time-log-export-dialog";
import { ReportsTimeLogFilters } from "@/components/reports/time-log/reports-time-log-filters";
import { ReportsTimeLogStaleBanner } from "@/components/reports/time-log/reports-time-log-stale-banner";
import { ReportsTimeLogTable } from "@/components/reports/time-log/reports-time-log-table";
import { useHoursReport } from "@/hooks/reports/use-hours-report";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type {
  HoursReportExcelQuerySchema,
  HoursReportPeriodSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";

export type ReportsTimeLogContentProps = {
  catalog: AdoCatalogSnapshot;
  initialScopes: { projectIds: string[]; teamIds: string[] };
};

function defaultPeriod(): HoursReportPeriodSchema {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return { kind: "month", monthKey: `${y}-${m}` };
}

function thisMonthLastIso(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString().slice(0, 10);
}

function defaultMonthKey(): string {
  const p = defaultPeriod();
  return p.kind === "month" ? p.monthKey : "";
}

export function ReportsTimeLogContent({
  catalog,
  initialScopes,
}: Readonly<ReportsTimeLogContentProps>) {
  const [period, setPeriod] = useState<HoursReportPeriodSchema>(defaultPeriod());
  const [rangeFrom, setRangeFrom] = useState<string>(thisMonthLastIso().slice(0, 8) + "01");
  const [rangeTo, setRangeTo] = useState<string>(thisMonthLastIso());
  const [projectIds] = useState<string[]>(initialScopes.projectIds);
  const [teamIds] = useState<string[]>(initialScopes.teamIds);

  const hoursReport = useHoursReport();

  const buildPayload = useCallback(
    (nextPeriod: HoursReportPeriodSchema): HoursReportRequestSchema => ({
      period: nextPeriod,
      scopes: { projectIds, teamIds },
    }),
    [projectIds, teamIds],
  );

  const payload = useMemo(
    () => buildPayload(period),
    [buildPayload, period],
  );

  const onGenerate = useCallback(async () => {
    await hoursReport.generate(payload);
  }, [hoursReport, payload]);

  const markStaleNow = useCallback(
    (nextPeriod: HoursReportPeriodSchema) => {
      hoursReport.markStale(buildPayload(nextPeriod));
    },
    [hoursReport, buildPayload],
  );

  const excelQuery = useMemo<HoursReportExcelQuerySchema>(
    () => ({
      periodKind: period.kind,
      monthKey: period.kind === "month" ? period.monthKey : undefined,
      fromIso: period.kind === "range" ? period.fromIso : undefined,
      toIso: period.kind === "range" ? period.toIso : undefined,
      projectIds,
      teamIds,
    }),
    [period, projectIds, teamIds],
  );

  const periodLabel = useMemo(() => {
    if (period.kind === "month") return `${period.monthKey}-01 → ${thisMonthLastIso()}`;
    return `${period.fromIso} → ${period.toIso}`;
  }, [period]);

  const year = period.kind === "month" ? Number(period.monthKey.slice(0, 4)) : new Date().getUTCFullYear();
  const monthKey = period.kind === "month" ? period.monthKey : `${year}-01`;

  const switchToMonth = useCallback(() => {
    const next: HoursReportPeriodSchema = { kind: "month", monthKey: defaultMonthKey() };
    setPeriod(next);
    markStaleNow(next);
  }, [markStaleNow]);

  const switchToRange = useCallback(() => {
    const next: HoursReportPeriodSchema = { kind: "range", fromIso: rangeFrom, toIso: rangeTo };
    setPeriod(next);
    markStaleNow(next);
  }, [rangeFrom, rangeTo, markStaleNow]);

  const onYearChange = useCallback(
    (y: number) => {
      if (period.kind !== "month") return;
      const next: HoursReportPeriodSchema = {
        kind: "month",
        monthKey: `${y}-${period.monthKey.slice(5, 7)}`,
      };
      setPeriod(next);
      markStaleNow(next);
    },
    [period, markStaleNow],
  );

  const onMonthKeyChange = useCallback(
    (k: string) => {
      const next: HoursReportPeriodSchema = { kind: "month", monthKey: k };
      setPeriod(next);
      markStaleNow(next);
    },
    [markStaleNow],
  );

  const onRangeFromChange = useCallback(
    (iso: string) => {
      setRangeFrom(iso);
      const next: HoursReportPeriodSchema =
        period.kind === "range" ? { kind: "range", fromIso: iso, toIso: period.toIso } : period;
      setPeriod(next);
      markStaleNow(next);
    },
    [period, markStaleNow],
  );

  const onRangeToChange = useCallback(
    (iso: string) => {
      setRangeTo(iso);
      const next: HoursReportPeriodSchema =
        period.kind === "range" ? { kind: "range", fromIso: period.fromIso, toIso: iso } : period;
      setPeriod(next);
      markStaleNow(next);
    },
    [period, markStaleNow],
  );

  const showStale = hoursReport.status === "stale";
  const showError = hoursReport.status === "error" || Boolean(hoursReport.errorMessage);
  const showEmpty =
    hoursReport.status === "ready" &&
    hoursReport.result !== null &&
    hoursReport.result.rows.length === 0;
  const showTable =
    hoursReport.status === "ready" &&
    hoursReport.result !== null &&
    hoursReport.result.rows.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <ReportsTimeLogFilters
        projects={catalog.projects}
        teams={catalog.teams}
        period={period}
        year={year}
        monthKey={monthKey}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onPeriodChange={(kind) => (kind === "month" ? switchToMonth() : switchToRange())}
        onYearChange={onYearChange}
        onMonthKeyChange={onMonthKeyChange}
        onRangeFromChange={onRangeFromChange}
        onRangeToChange={onRangeToChange}
        onGenerate={onGenerate}
        generating={hoursReport.status === "generating"}
        payload={payload}
      />

      {showStale ? (
        <ReportsTimeLogStaleBanner onRegenerate={onGenerate} regenerating={hoursReport.status === "generating"} />
      ) : null}

      {showError ? <CopilotErrorAlert message={hoursReport.errorMessage ?? "Error desconocido"} /> : null}

      {hoursReport.result !== null ? (
        <ReportsTimeLogAlerts alerts={hoursReport.result.alerts} />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">Periodo: {periodLabel}</p>
        <ReportsTimeLogExportDialog
          catalog={catalog}
          initialScopes={{ projectIds, teamIds }}
          initialPeriod={period}
          onDownload={(query) => hoursReport.downloadExcel(query)}
          disabled={hoursReport.status !== "ready"}
        />
      </div>

      {showEmpty ? <ReportsTimeLogEmptyState /> : null}
      {showTable ? <ReportsTimeLogTable rows={hoursReport.result?.rows ?? []} /> : null}
    </div>
  );
}