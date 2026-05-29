import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export function isConnectMethodReady(
  method: SessionAuthMethod,
  options: ConnectAuthOptions,
): boolean {
  if (!options.sessionReady) return false;
  return method === "oauth" ? options.oauthReady : options.patReady;
}

export function canContinueWithMethod(
  method: SessionAuthMethod | null,
  options: ConnectAuthOptions,
): boolean {
  return method !== null && isConnectMethodReady(method, options);
}
