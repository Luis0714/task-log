import { linkableWorkItemsResponseSchema } from "@/lib/schemas/linkable-work-items";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export type FetchLinkableWorkItemsInput = {
  project: string;
  team: string;
  includeBacklog?: boolean;
};

export type FetchLinkableWorkItemsResult =
  | { ok: true; items: LinkableWorkItemDto[] }
  | { ok: false; error: string };

export async function fetchLinkableWorkItems(
  input: FetchLinkableWorkItemsInput,
  signal?: AbortSignal,
): Promise<FetchLinkableWorkItemsResult> {
  const project = input.project.trim();
  const team = input.team.trim();
  if (!project || !team) {
    return { ok: true, items: [] };
  }

  const query = new URLSearchParams({
    project,
    team,
    includeBacklog: input.includeBacklog ? "true" : "false",
  });

  try {
    const res = await fetch(`/api/ado/linkable-work-items?${query.toString()}`, {
      signal,
    });
    const payload: unknown = await res.json();

    if (!res.ok) {
      return { ok: false, error: readErrorMessage(payload) };
    }

    const parsed = linkableWorkItemsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de work items inválida." };
    }

    return { ok: true, items: parsed.data.items };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: true, items: [] };
    }

    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los work items.";
    return { ok: false, error: message };
  }
}

function readErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "No se pudieron cargar los work items.";
}
