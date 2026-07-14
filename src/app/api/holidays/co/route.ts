import "server-only";

import { NextResponse } from "next/server";

import { requireManagementUser } from "@/app/api/assignments/helpers";
import { loadColombianHolidaysForRange } from "@/lib/holidays";

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
    const holidays = await loadColombianHolidaysForRange(
      `${year}-01-01`,
      `${year}-12-31`,
    );
    return NextResponse.json({ year, holidays });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los festivos de Colombia." },
      { status: 502 },
    );
  }
}