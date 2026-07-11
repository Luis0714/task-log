import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

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

function buildWhere(
  filter: NewsStoriesFilter,
): ReturnType<typeof and> | undefined {
  const parts = [];
  if (filter.projectId) {
    parts.push(eq(projectTeamNewsStories.projectId, filter.projectId));
  }
  if (filter.teamId !== undefined) {
    parts.push(
      filter.teamId === ""
        ? isNull(projectTeamNewsStories.teamId)
        : eq(projectTeamNewsStories.teamId, filter.teamId),
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
