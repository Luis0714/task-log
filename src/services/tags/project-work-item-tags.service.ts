import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { adoWorkItemTagsResponseSchema } from "@/lib/schemas/ado-catalog";

export type FetchProjectWorkItemTagsResult =
  | { ok: true; tags: AdoWorkItemTagDto[] }
  | { ok: false; error: string };

export async function fetchProjectWorkItemTags(
  project: string,
  signal?: AbortSignal,
): Promise<FetchProjectWorkItemTagsResult> {
  const trimmedProject = project.trim();
  if (!trimmedProject) {
    return { ok: true, tags: [] };
  }

  try {
    const res = await fetch(
      `/api/sprints/tags?project=${encodeURIComponent(trimmedProject)}`,
      { signal },
    );
    const payload: unknown = await res.json();

    if (!res.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "No se pudieron cargar los tags del proyecto.";
      return { ok: false, error: message };
    }

    const parsed = adoWorkItemTagsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Respuesta de tags inválida." };
    }

    return { ok: true, tags: parsed.data.tags };
  } catch (cause) {
    if (signal?.aborted) {
      return { ok: true, tags: [] };
    }

    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudieron cargar los tags del proyecto.";
    return { ok: false, error: message };
  }
}
