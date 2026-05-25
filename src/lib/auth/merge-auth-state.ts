import type { ServerAuthBootstrap, ServerAuthProfileFields, ServerAuthState } from "@/lib/auth/server-state";

export function mergeServerAuthState(
  bootstrap: ServerAuthBootstrap,
  profile: ServerAuthProfileFields,
): ServerAuthState {
  return { ...bootstrap, ...profile };
}
