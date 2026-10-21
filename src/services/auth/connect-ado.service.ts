import { readCurrentReturnPath } from "@/lib/auth/return-path";

const OAUTH_START_PATH = "/api/auth/azdo/start";

export function startMicrosoftConnect(role: string): void {
  const params = new URLSearchParams({
    nonce: crypto.randomUUID(),
    role,
  });
  const returnTo = readCurrentReturnPath();
  if (returnTo) params.set("returnTo", returnTo);
  window.location.assign(`${OAUTH_START_PATH}?${params.toString()}`);
}
