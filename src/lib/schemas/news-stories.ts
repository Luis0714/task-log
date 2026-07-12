import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

const trimmedStringArray = z
  .array(z.string().trim().min(1))
  .default([]);

/**
 * Filtro multi-scope para listar HUs de novedad vinculadas. Acepta listas
 * separadas por coma (de un query-params) o arrays nativos.
 *
 * - `projects`: si vacío, no se filtra por proyecto (sin filtro).
 * - `teams`: si vacío, no se filtra por equipo (incluye filas `team_id NULL`).
 */
export const newsStoriesFilterSchema = z.object({
  projects: trimmedStringArray,
  teams: trimmedStringArray,
});

export type NewsStoriesFilterPayload = z.infer<typeof newsStoriesFilterSchema>;

/** Body para vincular una HU a (Proyecto, Equipo). El POST sigue siendo
 *  single-scope: un link = un (proyecto, equipo). */
export const linkNewsStoryBodySchema = z.object({
  projectId: nonEmptyText,
  teamId: nonEmptyText.nullable().optional(),
  workItemId: z.coerce.number().int().positive(),
  workItemTitle: z.string().trim().nullable().optional(),
});

export type LinkNewsStoryBody = z.infer<typeof linkNewsStoryBodySchema>;
