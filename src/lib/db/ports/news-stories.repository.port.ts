import type { ProjectTeamNewsStory } from "@/lib/db/schema";

export type NewsStoriesFilter = Readonly<{
  projectId?: string;
  teamId?: string;
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
