import { NextResponse } from "next/server";

import { fetchAdoAttachment, isAdoAttachmentUrl } from "@/lib/azure-devops/attachments";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { apiErrorResponse } from "@/lib/errors/api-error-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attachmentUrl = searchParams.get("url") ?? "";

  if (!isAdoAttachmentUrl(attachmentUrl)) {
    return apiErrorResponse("URL de adjunto no válida.", 400);
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return new NextResponse(null, { status: 401 });
  }

  const res = await fetchAdoAttachment(auth, attachmentUrl);
  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
