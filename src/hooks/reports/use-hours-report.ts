"use client";

import { useCallback, useRef, useState } from "react";

import type { HoursReportResult } from "@/lib/reports/hours/hours-report-types";
import {
  downloadHoursReportExcel,
  generateHoursReport,
} from "@/services/reports/hours-reports.service";
import { appToast } from "@/lib/toast";
import { NEWS_NOT_CONFIGURED_CODE } from "@/lib/reports/hours/errors";
import type {
  HoursReportExcelRequestSchema,
  HoursReportRequestSchema,
} from "@/lib/schemas/reports-hours";

export type HoursReportStatus = "idle" | "generating" | "ready" | "error" | "stale";

export type UseHoursReportReturn = {
  status: HoursReportStatus;
  result: HoursReportResult | null;
  errorMessage: string | null;
  errorCode: string | null;
  generate: (payload: HoursReportRequestSchema) => Promise<void>;
  downloadExcel: (payload: HoursReportExcelRequestSchema) => Promise<void>;
  markStale: (currentPayload: HoursReportRequestSchema) => void;
};

export function useHoursReport(): UseHoursReportReturn {
  const [status, setStatus] = useState<HoursReportStatus>("idle");
  const [result, setResult] = useState<HoursReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const lastPayloadRef = useRef<HoursReportRequestSchema | null>(null);

  const generate = useCallback(async (payload: HoursReportRequestSchema) => {
    setStatus("generating");
    setErrorMessage(null);
    setErrorCode(null);
    lastPayloadRef.current = payload;
    const response = await generateHoursReport(payload);
    if (!response.ok) {
      setResult(null);
      setStatus("error");
      setErrorMessage(response.message);
      setErrorCode(response.code ?? null);
      if (response.code === NEWS_NOT_CONFIGURED_CODE) {
        appToast.warning(response.message);
      } else {
        appToast.error(response.message);
      }
      return;
    }
    setResult(response.value);
    setStatus("ready");
  }, []);

  const downloadExcel = useCallback(async (payload: HoursReportExcelRequestSchema) => {
    const response = await downloadHoursReportExcel(payload);
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

  return { status, result, errorMessage, errorCode, generate, downloadExcel, markStale };
}

function payloadsEqual(
  a: HoursReportRequestSchema,
  b: HoursReportRequestSchema,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}