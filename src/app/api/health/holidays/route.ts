import "server-only";

import { NextResponse } from "next/server";

import { loadColombianHolidaysForRange } from "@/lib/holidays";
import { resolveActiveProvider } from "@/lib/holidays/holiday-strategy-factory";

export const dynamic = "force-dynamic";

export type HolidaysHealthReport = {
  ok: boolean;
  provider: ReturnType<typeof resolveActiveProvider>;
  year: number;
  totalHolidays: number;
  holidays: { date: string; name: string }[];
  serverTimezone: string;
  error?: string;
};

export async function GET(): Promise<NextResponse<HolidaysHealthReport>> {
  const year = new Date().getFullYear();
  const provider = resolveActiveProvider();
  const serverTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown";

  try {
    const holidays = await loadColombianHolidaysForRange(
      `${year}-01-01`,
      `${year}-12-31`,
    );

    return NextResponse.json(
      {
        ok: holidays.length > 0,
        provider,
        year,
        totalHolidays: holidays.length,
        holidays,
        serverTimezone,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    return NextResponse.json(
      {
        ok: false,
        provider,
        year,
        totalHolidays: 0,
        holidays: [],
        serverTimezone,
        error: cause instanceof Error ? cause.message : String(cause),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}