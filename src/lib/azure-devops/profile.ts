import { isPatAuthMethod } from "@/lib/auth/auth-method";
import { adoAuthHeader } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoUserProfile = {
  id: string;
  displayName: string;
  publicAlias?: string;
};

type ProfileApiPayload = {
  id?: string;
  displayName?: string;
  publicAlias?: string;
  coreAttributes?: { PublicAlias?: { value?: string } };
};

export function parseProfileApiPayload(data: ProfileApiPayload): AdoUserProfile | null {
  if (!data.id) return null;
  return {
    id: data.id,
    displayName: data.displayName ?? data.publicAlias ?? "Usuario",
    publicAlias: data.publicAlias ?? data.coreAttributes?.PublicAlias?.value,
  };
}

function profileApiBase(auth: AdoCallerAuth): string {
  return isPatAuthMethod()
    ? `https://vssps.dev.azure.com/${encodeURIComponent(auth.organization)}`
    : "https://app.vssps.visualstudio.com";
}

export async function fetchCurrentAdoProfile(
  auth: AdoCallerAuth,
): Promise<AdoUserProfile | null> {
  try {
    const res = await fetch(
      `${profileApiBase(auth)}/_apis/profile/profiles/me?api-version=7.1`,
      {
        headers: { Authorization: adoAuthHeader(auth) },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return parseProfileApiPayload((await res.json()) as ProfileApiPayload);
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
