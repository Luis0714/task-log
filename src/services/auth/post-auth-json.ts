type AuthJsonFailure = {
  ok: false;
  errorMessage: string;
  reason?: string;
};

type AuthJsonSuccess = {
  ok: true;
};

export type AuthJsonResult = AuthJsonSuccess | AuthJsonFailure;

export async function postAuthJson(
  path: string,
  payload: unknown,
  fallbackErrorMessage: string,
): Promise<AuthJsonResult> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    error?: string;
    ok?: boolean;
    reason?: string;
  };

  if (response.ok && body.ok !== false) {
    return { ok: true };
  }

  return {
    ok: false,
    errorMessage: body.error ?? fallbackErrorMessage,
    reason: body.reason,
  };
}
