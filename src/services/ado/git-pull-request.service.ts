import {
  createPullRequestResponseSchema,
  type CreatePullRequestBody,
  type CreatePullRequestResponse,
} from "@/lib/schemas/git-pull-request";

export type CreatePullRequestResult =
  | { ok: true; pullRequest: CreatePullRequestResponse }
  | { ok: false; error: string };

function readErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}

export async function createPullRequestRequest(
  body: CreatePullRequestBody,
): Promise<CreatePullRequestResult> {
  try {
    const res = await fetch("/api/ado/git/pull-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudo crear el pull request."),
      };
    }

    const parsed = createPullRequestResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de creación inválida." };
    }

    return { ok: true, pullRequest: parsed.data };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo crear el pull request.";
    return { ok: false, error: message };
  }
}
