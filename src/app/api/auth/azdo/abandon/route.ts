import { NextResponse } from "next/server";

import { getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Limpia un flujo OAuth abandonado (p. ej. el usuario pulsó «atrás» en Microsoft). */
export async function POST() {
  const session = await getTaskPilotSession();
  session.pendingOAuth = undefined;
  await session.save();

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
