import { NextResponse } from "next/server";

import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

/** Conexión PAT sin cuenta guardada ya no está soportada. */
export async function POST() {
  return NextResponse.json(
    { error: USER_MESSAGES.patConnectDeprecated },
    { status: 403 },
  );
}
