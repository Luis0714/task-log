import type {
  ReleaseDefinitionOption,
  ReleaseListItem,
} from "@/lib/releases/types";
import { releaseListResponseSchema } from "@/lib/schemas/ado-releases";

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

export type FetchReleaseListResult =
  | {
      ok: true;
      definitions: ReleaseDefinitionOption[];
      items: ReleaseListItem[];
      pendingCount: number;
      definitionId: number | null;
    }
  | { ok: false; error: string };

export async function fetchReleaseList(
  project: string,
  definitionId?: number,
  signal?: AbortSignal,
): Promise<FetchReleaseListResult> {
  const params = new URLSearchParams({ project });
  if (definitionId) params.set("definitionId", String(definitionId));

  try {
    const res = await fetch(`/api/ado/releases?${params}`, { signal });
    const payload: unknown = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudieron cargar los releases."),
      };
    }
    const parsed = releaseListResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de releases inválida." };
    }
    return { ok: true, ...parsed.data };
  } catch (cause) {
    if (signal?.aborted) {
      return {
        ok: true,
        definitions: [],
        items: [],
        pendingCount: 0,
        definitionId: null,
      };
    }
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los releases.";
    return { ok: false, error: message };
  }
}

export async function approveReleaseRequest(
  project: string,
  approvalId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/ado/releases/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    });
    const payload: unknown = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: readErrorMessage(payload, "No se pudo aprobar el despliegue."),
      };
    }
    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo aprobar el despliegue.";
    return { ok: false, error: message };
  }
}
