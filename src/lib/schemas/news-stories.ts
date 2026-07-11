import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

/** Filtro por (Proyecto, Equipo) para listar HUs de novedad vinculadas. */
export const newsStoriesFilterSchema = z.object({
  projectId: z.string().trim().min(1),
  teamId: z.string().trim().min(1).nullable().optional(),
});

export type NewsStoriesFilterPayload = z.infer<typeof newsStoriesFilterSchema>;

/** Body para vincular una HU a (Proyecto, Equipo). */
export const linkNewsStoryBodySchema = z.object({
  projectId: nonEmptyText,
  teamId: nonEmptyText.nullable().optional(),
  workItemId: z.coerce.number().int().positive(),
  workItemTitle: z.string().trim().nullable().optional(),
});

export type LinkNewsStoryBody = z.infer<typeof linkNewsStoryBodySchema>;

/** Búsqueda de HUs en el backlog de Azure DevOps (project + texto libre). */
export const searchNewsStoriesQuerySchema = z.object({
  project: nonEmptyText,
  team: z.string().trim().optional(),
  q: z.string().trim().min(3),
  /** Límite opcional para evitar respuestas enormes del WIQL. */
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type SearchNewsStoriesQuery = z.infer<typeof searchNewsStoriesQuerySchema>;
