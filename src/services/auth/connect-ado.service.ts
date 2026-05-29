export type ConnectPatPayload = {
  pat: string;
};

export type ConnectPatResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export async function connectWithPat(
  payload: ConnectPatPayload,
): Promise<ConnectPatResult> {
  const response = await fetch("/api/auth/pat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as { error?: string };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: body.error ?? "No pudimos conectarte. Revisa los datos e inténtalo de nuevo.",
  };
}

export function startMicrosoftConnect(): void {
  window.location.assign("/api/auth/azdo/start");
}
