import { NextResponse } from "next/server";

import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { fetchAdoAvatar } from "@/lib/azure-devops/profile";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return new NextResponse(null, { status: 401 });
  }

  const profile = await resolveAdoProfile(auth, { persist: true });
  if (!profile) {
    return new NextResponse(null, { status: 404 });
  }

  const avatarRes = await fetchAdoAvatar(auth, profile.id);
  if (!avatarRes.ok) {
    return new NextResponse(null, { status: avatarRes.status });
  }

  const contentType = avatarRes.headers.get("content-type") ?? "image/png";
  const buffer = await avatarRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
