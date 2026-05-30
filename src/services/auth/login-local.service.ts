export type LoginLocalPayload = {
  email: string;
  password: string;
};

export type LoginLocalFailureReason =
  | "invalid_credentials"
  | "user_not_found"
  | "microsoft_account";

export type LoginLocalResult =
  | { ok: true }
  | { ok: false; errorMessage: string; reason?: LoginLocalFailureReason };

export async function loginLocal(
  payload: LoginLocalPayload,
): Promise<LoginLocalResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    error?: string;
    reason?: LoginLocalFailureReason;
  };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: body.error ?? "No pudimos iniciar sesión. Inténtalo de nuevo.",
    reason: body.reason,
  };
}
