const OAUTH_START_PATH = "/api/auth/azdo/start";

export function startMicrosoftConnect(): void {
  const nonce = crypto.randomUUID();
  window.location.assign(`${OAUTH_START_PATH}?nonce=${encodeURIComponent(nonce)}`);
}
