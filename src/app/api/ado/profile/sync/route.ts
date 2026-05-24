import { NextResponse } from "next/server";

import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await resolveAdoCaller();
  if (!auth) {
    return NextResponse.json({ error: "Sin conexión ADO" }, { status: 401 });
  }

  const profile = await resolveAdoProfile(auth, { persist: true });
  if (!profile) {
    return NextResponse.json({ error: "No se pudo obtener el perfil" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
