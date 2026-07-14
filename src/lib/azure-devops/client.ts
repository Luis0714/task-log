import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export function adoAuthHeader(auth: AdoCallerAuth): string {
  if (auth.mode === "pat") {
    const token = Buffer.from(`:${auth.pat}`).toString("base64");
    return `Basic ${token}`;
  }
  return `Bearer ${auth.accessToken}`;
}

export function adoOrgBase(auth: AdoCallerAuth): string {
  return `https://dev.azure.com/${encodeURIComponent(auth.organization)}`;
}

export function adoProjectBase(auth: AdoCallerAuth): string {
  return `https://dev.azure.com/${encodeURIComponent(auth.organization)}/${encodeURIComponent(auth.project)}`;
}

export async function adoFetch(
  auth: AdoCallerAuth,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: adoAuthHeader(auth),
      ...init?.headers,
    },
  });
}

export function escapeWiqlString(value: string): string {
  return value.replaceAll("'", "''");
}
