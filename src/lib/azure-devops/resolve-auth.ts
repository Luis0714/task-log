import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { refreshAccessToken } from "@/lib/auth/entra";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";

export type AdoCallerAuth =
  | { mode: "oauth"; accessToken: string; organization: string; project: string }
  | { mode: "pat"; organization: string; project: string; pat: string };

export function getPatTargetFromEnv(): { organization: string; project: string } | null {
  const organization = process.env.AZDO_ORGANIZATION ?? process.env.AZDO_ORG;
  const project = process.env.AZDO_PROJECT;
  if (!organization?.trim() || !project?.trim()) return null;
  return {
    organization: organization.trim(),
    project: project.trim(),
  };
}

function patFromEnv(): AdoCallerAuth | null {
  const target = getPatTargetFromEnv();
  const pat = process.env.AZDO_PAT;
  if (!target || !pat?.trim()) return null;
  return {
    mode: "pat",
    organization: target.organization,
    project: target.project,
    pat: pat.trim(),
  };
}

async function oauthFromSession(): Promise<AdoCallerAuth | null> {
  if (!isIronSessionConfigured()) return null;

  const session = await getTaskPilotSession();
  if (
    !session.azdoRefreshToken ||
    !session.defaultOrg?.trim() ||
    !session.defaultProject?.trim()
  ) {
    return null;
  }

  try {
    const tokens = await refreshAccessToken(session.azdoRefreshToken);
    if (tokens.refresh_token) {
      session.azdoRefreshToken = tokens.refresh_token;
      await session.save();
    }
    return {
      mode: "oauth",
      accessToken: tokens.access_token,
      organization: session.defaultOrg.trim(),
      project: session.defaultProject.trim(),
    };
  } catch {
    return null;
  }
}

export async function resolveAdoCaller(): Promise<AdoCallerAuth | null> {
  if (isPatAuthMethod()) return patFromEnv();
  if (isOAuthAuthMethod()) return oauthFromSession();
  return null;
}

export function isPatConfigured(): boolean {
  if (!isPatAuthMethod()) return false;
  return patFromEnv() !== null;
}
