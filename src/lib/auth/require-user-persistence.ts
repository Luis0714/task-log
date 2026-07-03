import "server-only";

import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { isUserPersistenceReady } from "@/lib/db";

export type PersistenceGateResult =
  | { ok: true }
  | { ok: false; message: string; status: number };

export function requireUserPersistence(): PersistenceGateResult {
  if (!isIronSessionConfigured()) {
    return {
      ok: false,
      status: 503,
      message: USER_MESSAGES.sessionUnavailable,
    };
  }

  const { patReady } = getConnectAuthOptions();
  if (!patReady) {
    return {
      ok: false,
      status: 403,
      message: USER_MESSAGES.authUnavailable,
    };
  }

  if (!isUserPersistenceReady()) {
    return {
      ok: false,
      status: 503,
      message: USER_MESSAGES.persistenceUnavailable,
    };
  }

  return { ok: true };
}

export function requirePersistenceForOAuth(): PersistenceGateResult {
  const base = requireUserPersistence();
  if (!base.ok) return base;

  const { oauthReady } = getConnectAuthOptions();
  if (!oauthReady) {
    return {
      ok: false,
      status: 403,
      message: USER_MESSAGES.microsoftUnavailable,
    };
  }

  return { ok: true };
}
