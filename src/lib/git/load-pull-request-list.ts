import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { resolveGitRepositoryId } from "@/lib/azure-devops/git";
import {
  listAdoPullRequests,
  type AdoPullRequestLifecycle,
} from "@/lib/azure-devops/pull-requests";
import { mapAdoPullRequest } from "@/lib/pull-requests/map-ado-pull-request";
import type { PullRequestListItem } from "@/lib/pull-requests/types";

export type LoadPullRequestListInput = {
  project: string;
  status: AdoPullRequestLifecycle;
  repository?: string;
};

export type PullRequestListSnapshot = {
  items: PullRequestListItem[];
  activeCount: number;
};

function mapList(
  pullRequests: Awaited<ReturnType<typeof listAdoPullRequests>>,
  currentUserId: string | null,
  project: string,
): PullRequestListItem[] {
  return pullRequests
    .map((pullRequest) => mapAdoPullRequest(pullRequest, currentUserId, project))
    .filter((item): item is PullRequestListItem => item !== null);
}

export async function loadPullRequestList(
  input: LoadPullRequestListInput,
): Promise<PullRequestListSnapshot> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const profile = await resolveAdoProfile(auth, { persist: true });
  const currentUserId = profile?.id ?? null;
  const repositoryName = input.repository?.trim();
  const repositoryId = repositoryName
    ? await resolveGitRepositoryId(auth, repositoryName)
    : undefined;

  if (input.status === "active") {
    const listed = await listAdoPullRequests(auth, "active", repositoryId);
    const items = mapList(listed, currentUserId, input.project);
    return { items, activeCount: items.length };
  }

  const [listed, active] = await Promise.all([
    listAdoPullRequests(auth, input.status, repositoryId),
    listAdoPullRequests(auth, "active", repositoryId),
  ]);

  return {
    items: mapList(listed, currentUserId, input.project),
    activeCount: mapList(active, currentUserId, input.project).length,
  };
}
