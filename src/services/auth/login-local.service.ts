export type LoginLocalPayload = {
  username: string;
  password: string;
};

export type LoginLocalResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export async function loginLocal(
  payload: LoginLocalPayload,
): Promise<LoginLocalResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as { error?: string };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: body.error ?? "No pudimos iniciar sesión. Inténtalo de nuevo.",
  };
}
