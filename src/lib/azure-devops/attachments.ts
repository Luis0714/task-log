import { adoFetch, adoOrgBase, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export async function uploadAttachment(
  auth: AdoCallerAuth,
  buffer: ArrayBuffer,
  fileName: string,
): Promise<{ url: string } | null> {
  const endpoint = `${adoProjectBase(auth)}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`;
  const res = await adoFetch(auth, endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: buffer,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id: string; url: string };
  return { url: data.url };
}

export async function fetchAdoAttachment(
  auth: AdoCallerAuth,
  attachmentUrl: string,
): Promise<Response> {
  const fullUrl = attachmentUrl.startsWith("http")
    ? attachmentUrl
    : `${adoOrgBase(auth)}${attachmentUrl}`;
  const separator = fullUrl.includes("?") ? "&" : "?";
  return adoFetch(auth, `${fullUrl}${separator}api-version=7.1`);
}

export function isAdoAttachmentUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return (
      hostname === "dev.azure.com" &&
      pathname.includes("/_apis/wit/attachments/")
    );
  } catch {
    return url.startsWith("/_apis/wit/attachments/");
  }
}
