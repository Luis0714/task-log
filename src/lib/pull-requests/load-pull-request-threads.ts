import "server-only";

import { listAdoPullRequestThreads } from "@/lib/azure-devops/pull-request-threads";
import { mapAdoPullRequestThreads } from "@/lib/pull-requests/map-ado-threads";
import { resolvePullRequestGitContext } from "@/lib/pull-requests/resolve-pr-repository";
import type { PullRequestThread } from "@/lib/pull-requests/thread-types";

export type LoadPullRequestThreadsInput = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

export async function loadPullRequestThreads(
  input: LoadPullRequestThreadsInput,
): Promise<PullRequestThread[]> {
  const { auth, repositoryId } = await resolvePullRequestGitContext(input);
  const raw = await listAdoPullRequestThreads(auth, repositoryId, input.pullRequestId);
  return mapAdoPullRequestThreads(raw);
}
