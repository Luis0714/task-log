import "client-only";

import type { HoursReportResult } from "@/lib/reports/hours/hours-report-types";
import type {
  HoursReportRequestSchema,
  HoursReportExcelRequestSchema,
} from "@/lib/schemas/reports-hours";

const FETCH_TIMEOUT_MS = 60_000;

export type HoursReportServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; status: number };

export async function generateHoursReport(
  payload: HoursReportRequestSchema,
): Promise<HoursReportServiceResult<HoursReportResult>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/reports/hours/generate`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        message:
          typeof body.error === "string"
            ? body.error
            : "No se pudo generar el reporte.",
        status: res.status,
      };
    }
    return { ok: true, value: body as HoursReportResult };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar con el servidor.",
      status: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function downloadHoursReportExcel(
  payload: HoursReportExcelRequestSchema,
): Promise<HoursReportServiceResult<{ blob: Blob; filename: string }>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // POST con body: las personas ocultas (y el resto de filtros) nunca
    // viajan por la URL.
    const res = await fetch(`/api/reports/hours/excel`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        ok: false,
        message:
          typeof body.error === "string"
            ? body.error
            : "No se pudo generar el Excel.",
        status: res.status,
      };
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? "reporte-horas.xlsx";
    return { ok: true, value: { blob, filename } };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar con el servidor.",
      status: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}