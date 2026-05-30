import type { ConnectPatPayload } from "@/services/auth/connect-ado.service";

export type RegisterLocalPayload = ConnectPatPayload;

export type RegisterLocalSuccess = {
  ok: true;
  email: string;
  password: string;
  notice: string;
};

export type RegisterLocalFailure = {
  ok: false;
  errorMessage: string;
};

export type RegisterLocalResult = RegisterLocalSuccess | RegisterLocalFailure;

export async function registerLocalPat(
  payload: RegisterLocalPayload,
): Promise<RegisterLocalResult> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    error?: string;
    email?: string;
    password?: string;
    notice?: string;
  };

  if (response.ok && body.email && body.password && body.notice) {
    return {
      ok: true,
      email: body.email,
      password: body.password,
      notice: body.notice,
    };
  }

  return {
    ok: false,
    errorMessage:
      body.error ??
      "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.",
  };
}
