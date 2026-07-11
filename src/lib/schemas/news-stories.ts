import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

/**
 * Una query de búsqueda es válida cuando:
 * - es un ID numérico positivo (búsqueda exacta por `System.Id`), o
 * - tiene al menos 3 caracteres (búsqueda por título).
 *
 * Refleja la regla de la HU-02 (CA-07): el buscador debe responder tanto a
 * pegar un ID como a escribir parte del título.
 */
const trimmedQuery = z.string().trim();
const searchQuerySchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      const trimmed = trimmedQuery.parse(value);
      if (/^\d+$/.test(trimmed)) return Number(trimmed) > 0;
      return trimmed.length >= 3;
    },
    {
      message:
        "Escribe al menos 3 caracteres o un ID numérico positivo.",
    },
  )
  .transform((value) => trimmedQuery.parse(value));

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
  q: searchQuerySchema,
  /** Límite opcional para evitar respuestas enormes del WIQL. */
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type SearchNewsStoriesQuery = z.infer<typeof searchNewsStoriesQuerySchema>;

/** Indica si la query es un ID numérico positivo. */
export function isNumericIdQuery(query: string): boolean {
  return /^\d+$/.test(query.trim()) && Number(query) > 0;
}