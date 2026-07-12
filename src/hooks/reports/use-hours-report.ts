"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { HoursReportResult } from "@/lib/reports/hours/hours-report-types";
import {
  downloadHoursReportExcel,
  generateHoursReport,
} from "@/services/reports/hours-reports.service";
import { appToast } from "@/lib/toast";
import type {
  HoursReportExcelQuerySchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";

export type HoursReportStatus = "idle" | "generating" | "ready" | "error" | "stale";

export type UseHoursReportReturn = {
  status: HoursReportStatus;
  result: HoursReportResult | null;
  errorMessage: string | null;
  generate: (payload: HoursReportRequestSchema) => Promise<void>;
  downloadExcel: (query: HoursReportExcelQuerySchema) => Promise<void>;
  markStale: (currentPayload: HoursReportRequestSchema) => void;
};

export function useHoursReport(): UseHoursReportReturn {
  const [status, setStatus] = useState<HoursReportStatus>("idle");
  const [result, setResult] = useState<HoursReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastPayloadRef = useRef<HoursReportRequestSchema | null>(null);

  const generate = useCallback(async (payload: HoursReportRequestSchema) => {
    setStatus("generating");
    setErrorMessage(null);
    lastPayloadRef.current = payload;
    const response = await generateHoursReport(payload);
    if (!response.ok) {
      setStatus("error");
      setErrorMessage(response.message);
      appToast.error(response.message);
      return;
    }
    setResult(response.value);
    setStatus("ready");
  }, []);

  const downloadExcel = useCallback(async (query: HoursReportExcelQuerySchema) => {
    const response = await downloadHoursReportExcel(query);
    if (!response.ok) {
      appToast.error(response.message);
      return;
    }
    const { blob, filename } = response.value;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const markStale = useCallback((currentPayload: HoursReportRequestSchema) => {
    const last = lastPayloadRef.current;
    if (!last) return;
    if (status !== "ready") return;
    if (payloadsEqual(last, currentPayload)) return;
    setStatus("stale");
  }, [status]);

  useEffect(() => () => undefined, []);

  return { status, result, errorMessage, generate, downloadExcel, markStale };
}

function payloadsEqual(
  a: HoursReportRequestSchema,
  b: HoursReportRequestSchema,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}