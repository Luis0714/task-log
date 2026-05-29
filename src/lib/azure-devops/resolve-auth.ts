import { getAzdoAuthMethod, isBothAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { refreshAccessToken } from "@/lib/auth/entra";
import {
  clearSessionCredentials,
  getTaskPilotSession,
  isIronSessionConfigured,
} from "@/lib/auth/session";

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

function patFromSession(
  session: Awaited<ReturnType<typeof getTaskPilotSession>>,
): AdoCallerAuth | null {
  const pat = session.azdoPat?.trim();
  const organization = session.defaultOrg?.trim();
  const project = session.defaultProject?.trim();
  if (!pat || !organization || !project) return null;

  return {
    mode: "pat",
    organization,
    project,
    pat,
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

async function resolveFromUserSession(): Promise<AdoCallerAuth | null> {
  if (!isIronSessionConfigured()) return null;

  const session = await getTaskPilotSession();

  if (session.sessionAuthMethod === "pat") {
    return patFromSession(session);
  }

  if (session.sessionAuthMethod === "oauth") {
    return oauthFromSession();
  }

  return null;
}

export async function resolveAdoCaller(): Promise<AdoCallerAuth | null> {
  const sessionAuth = await resolveFromUserSession();
  if (sessionAuth) return sessionAuth;

  const deployMethod = getAzdoAuthMethod();

  if (deployMethod === "pat") {
    return patFromEnv();
  }

  if (deployMethod === "oauth") {
    return oauthFromSession();
  }

  return null;
}

export function isPatConfigured(): boolean {
  if (!isPatAuthMethod()) return false;
  return patFromEnv() !== null;
}

export async function isSessionPatReady(): Promise<boolean> {
  if (!isIronSessionConfigured()) return false;
  const session = await getTaskPilotSession();
  return Boolean(
    session.sessionAuthMethod === "pat" &&
      session.azdoPat?.trim() &&
      session.defaultOrg?.trim() &&
      session.defaultProject?.trim(),
  );
}

export async function isSessionOAuthReady(): Promise<boolean> {
  if (!isIronSessionConfigured()) return false;
  const session = await getTaskPilotSession();
  return Boolean(
    session.sessionAuthMethod === "oauth" &&
      session.azdoRefreshToken &&
      session.defaultOrg?.trim() &&
      session.defaultProject?.trim(),
  );
}

export async function clearUserSessionAuth(): Promise<void> {
  if (!isIronSessionConfigured()) return;
  const session = await getTaskPilotSession();
  clearSessionCredentials(session);
  await session.save();
}

export function usesServerEnvPat(): boolean {
  return getAzdoAuthMethod() === "pat" && patFromEnv() !== null && !isBothAuthMethod();
}
