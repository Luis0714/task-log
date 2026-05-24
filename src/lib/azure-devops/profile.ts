import { adoAuthHeader } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoUserProfile = {
  id: string;
  displayName: string;
  publicAlias?: string;
};

/** OAuth Bearer works on app.vssps; PAT Basic auth requires the org-scoped vssps host. */
function profileApiBase(auth: AdoCallerAuth): string {
  if (auth.mode === "pat") {
    return `https://vssps.dev.azure.com/${encodeURIComponent(auth.organization)}`;
  }
  return "https://app.vssps.visualstudio.com";
}

function profileMeUrl(auth: AdoCallerAuth): string {
  return `${profileApiBase(auth)}/_apis/profile/profiles/me?api-version=7.1`;
}

export async function fetchCurrentAdoProfile(
  auth: AdoCallerAuth,
): Promise<AdoUserProfile | null> {
  try {
    const res = await fetch(profileMeUrl(auth), {
      headers: { Authorization: adoAuthHeader(auth) },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      id?: string;
      displayName?: string;
      publicAlias?: string;
      coreAttributes?: { PublicAlias?: { value?: string } };
    };

    if (!data.id) return null;

    return {
      id: data.id,
      displayName: data.displayName ?? data.publicAlias ?? "Usuario",
      publicAlias: data.publicAlias ?? data.coreAttributes?.PublicAlias?.value,
    };
  } catch {
    return null;
  }
}

export function buildAdoAvatarUrl(
  auth: AdoCallerAuth,
  profileId: string,
  size: "small" | "medium" | "large" = "medium",
) {
  const params = new URLSearchParams({
    "api-version": "7.1-preview.1",
    size,
  });
  return `${profileApiBase(auth)}/_apis/profile/profiles/${encodeURIComponent(profileId)}/avatar?${params.toString()}`;
}

export async function fetchAdoAvatar(
  auth: AdoCallerAuth,
  profileId: string,
): Promise<Response> {
  return fetch(buildAdoAvatarUrl(auth, profileId), {
    headers: { Authorization: adoAuthHeader(auth) },
    cache: "no-store",
  });
}
