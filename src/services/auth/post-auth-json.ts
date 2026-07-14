type AuthJsonFailure = {
  ok: false;
  errorMessage: string;
  reason?: string;
};

type AuthJsonSuccess = {
  ok: true;
  data: Record<string, unknown>;
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
  } & Record<string, unknown>;

  if (response.ok && body.ok !== false) {
    return { ok: true, data: body };
  }

  return {
    ok: false,
    errorMessage: body.error ?? fallbackErrorMessage,
    reason: body.reason,
  };
}
