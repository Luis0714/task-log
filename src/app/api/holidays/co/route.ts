import "server-only";

import { NextResponse } from "next/server";

import { loadColombianHolidays } from "@/lib/holidays/co";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

function isValidYear(value: number): boolean {
  return Number.isInteger(value) && value >= 1900 && value <= 2200;
}

export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const rawYear = url.searchParams.get("year");
  const year = rawYear ? Number(rawYear) : NaN;
  if (!isValidYear(year)) {
    return NextResponse.json(
      { error: "Año inválido. Usa un entero entre 1900 y 2200." },
      { status: 400 },
    );
  }

  try {
    const holidays = await loadColombianHolidays(year);
    return NextResponse.json({ year, holidays });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los festivos de Colombia desde Nager.Date." },
      { status: 502 },
    );
  }
}
