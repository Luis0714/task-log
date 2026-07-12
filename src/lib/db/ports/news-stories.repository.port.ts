import type { ProjectTeamNewsStory } from "@/lib/db/schema";

export type NewsStoriesFilter = Readonly<{
  /** Si está vacío, no se filtra por proyecto. */
  projectIds?: ReadonlyArray<string>;
  /** Si está vacío, no se filtra por equipo (incluye filas con `teamId` nulo). */
  teamIds?: ReadonlyArray<string>;
}>;

export type CreateNewsStoryInput = Readonly<{
  projectId: string;
  teamId: string | null;
  workItemId: number;
  workItemTitleSnapshot: string | null;
  linkedByUserId: string;
}>;

export interface NewsStoriesRepository {
  list(filter: NewsStoriesFilter): Promise<ProjectTeamNewsStory[]>;

  findByKey(input: {
    projectId: string;
    teamId: string | null;
    workItemId: number;
  }): Promise<ProjectTeamNewsStory | null>;

  create(input: CreateNewsStoryInput): Promise<ProjectTeamNewsStory>;

  deleteById(id: string): Promise<void>;
}
