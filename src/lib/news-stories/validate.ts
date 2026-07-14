import type {
  CreateNewsStoryInput,
  NewsStoriesFilter,
} from "@/lib/db";

export type LinkNewsStoryError =
  | { code: "missingProjectId"; message: string }
  | { code: "invalidWorkItemId"; message: string }
  | { code: "duplicate"; message: string };

export type LinkNewsStoryOk = { ok: true };
export type LinkNewsStoryResult =
  | (LinkNewsStoryOk & { input: CreateNewsStoryInput })
  | { ok: false; error: LinkNewsStoryError };

/**
 * Valida el payload de creación de una HU de novedad antes de pegarle a la BD.
 * Reglas de negocio de HU-02:
 * - `projectId` obligatorio.
 * - `workItemId` entero positivo.
 * - El repo comprobará duplicado vía índice único `(project_id, team_id, work_item_id)`;
 *   esta capa es defensiva para devolver un error HTTP 409 con código
 *   específico en caso de carrera (doble click simultáneo).
 */
export function validateLinkNewsStory(input: {
  projectId?: unknown;
  teamId?: unknown;
  workItemId?: unknown;
  workItemTitle?: unknown;
  linkedByUserId: string;
}): LinkNewsStoryResult {
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : "";
  if (!projectId) {
    return {
      ok: false,
      error: {
        code: "missingProjectId",
        message: "El proyecto es obligatorio.",
      },
    };
  }
  const teamIdRaw =
    typeof input.teamId === "string" ? input.teamId.trim() : "";
  const teamId = teamIdRaw === "" ? null : teamIdRaw;

  const numericWorkItemId =
    typeof input.workItemId === "number"
      ? input.workItemId
      : typeof input.workItemId === "string"
        ? Number(input.workItemId)
        : Number.NaN;
  if (
    !Number.isInteger(numericWorkItemId) ||
    numericWorkItemId <= 0
  ) {
    return {
      ok: false,
      error: {
        code: "invalidWorkItemId",
        message: "El ID de la HU debe ser un número entero positivo.",
      },
    };
  }

  const workItemTitleSnapshot =
    typeof input.workItemTitle === "string"
      ? input.workItemTitle.trim() || null
      : null;

  return {
    ok: true,
    input: {
      projectId,
      teamId,
      workItemId: numericWorkItemId,
      workItemTitleSnapshot,
      linkedByUserId: input.linkedByUserId,
    },
  };
}

/** Convierte una query params cruda (`?projects=A,B&teams=Backend`) al filtro
 *  multi-scope del repo. Acepta listas separadas por coma y descarta vacíos. */
export function newsStoriesFilterFromList(input: {
  projects?: unknown;
  teams?: unknown;
}): NewsStoriesFilter {
  return {
    projectIds: splitCsv(input.projects),
    teamIds: splitCsv(input.teams),
  };
}

function splitCsv(value: unknown): ReadonlyArray<string> | undefined {
  if (typeof value !== "string") return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}
