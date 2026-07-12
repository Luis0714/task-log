import "server-only";

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  projectTeamNewsStories,
  type NewProjectTeamNewsStory,
} from "@/lib/db/schema";
import type {
  CreateNewsStoryInput,
  NewsStoriesFilter,
  NewsStoriesRepository,
} from "@/lib/db/ports/news-stories.repository.port";

/**
 * Construye la cláusula `WHERE` multi-scope. Semántica:
 * - `projectIds` no vacío → `project_id IN (…projectIds)`.
 * - `teamIds` no vacío → `(team_id IN (…teamIds) OR team_id IS NULL)`
 *   (los "Sin equipo" a nivel proyecto también aparecen).
 * Si el array está vacío (o `undefined`), ese eje no filtra — equivalente
 * a "todos".
 */
function buildWhere(
  filter: NewsStoriesFilter,
): ReturnType<typeof and> | undefined {
  const parts = [];
  const projectIds = filter.projectIds?.filter((p) => p.length > 0) ?? [];
  if (projectIds.length > 0) {
    parts.push(inArray(projectTeamNewsStories.projectId, [...projectIds]));
  }
  const teamIds = filter.teamIds?.filter((t) => t.length > 0) ?? [];
  if (teamIds.length > 0) {
    parts.push(
      or(
        inArray(projectTeamNewsStories.teamId, [...teamIds]),
        isNull(projectTeamNewsStories.teamId),
      )!,
    );
  }
  return parts.length ? and(...parts) : undefined;
}

export const drizzleNewsStoriesRepository: NewsStoriesRepository = {
  async list(filter) {
    const where = buildWhere(filter);
    return getDb()
      .select()
      .from(projectTeamNewsStories)
      .where(where)
      .orderBy(
        asc(projectTeamNewsStories.teamId),
        asc(projectTeamNewsStories.workItemId),
      );
  },

  async findByKey({ projectId, teamId, workItemId }) {
    const rows = await getDb()
      .select()
      .from(projectTeamNewsStories)
      .where(
        and(
          eq(projectTeamNewsStories.projectId, projectId),
          teamId === null
            ? isNull(projectTeamNewsStories.teamId)
            : eq(projectTeamNewsStories.teamId, teamId),
          eq(projectTeamNewsStories.workItemId, workItemId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async create(input: CreateNewsStoryInput) {
    const values: NewProjectTeamNewsStory = {
      projectId: input.projectId,
      teamId: input.teamId,
      workItemId: input.workItemId,
      workItemTitleSnapshot: input.workItemTitleSnapshot,
      linkedByUserId: input.linkedByUserId,
    };
    const [row] = await getDb()
      .insert(projectTeamNewsStories)
      .values(values)
      .returning();
    if (!row) {
      throw new Error("No se pudo guardar la HU de novedad.");
    }
    return row;
  },

  async deleteById(id) {
    await getDb()
      .delete(projectTeamNewsStories)
      .where(eq(projectTeamNewsStories.id, id));
  },
};
