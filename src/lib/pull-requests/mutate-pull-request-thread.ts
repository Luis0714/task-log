import "server-only";

import {
  createAdoPullRequestThread,
  patchAdoPullRequestThreadStatus,
  replyAdoPullRequestThread,
} from "@/lib/azure-devops/pull-request-threads";
import { loadPullRequestThreads } from "@/lib/pull-requests/load-pull-request-threads";
import { resolvePullRequestGitContext } from "@/lib/pull-requests/resolve-pr-repository";
import type {
  CreatePullRequestThreadInput,
  PullRequestThread,
  PullRequestThreadStatus,
} from "@/lib/pull-requests/thread-types";

export type MutatePullRequestThreadBase = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

export type CreatePullRequestThreadMutation = MutatePullRequestThreadBase & {
  action: "create";
} & CreatePullRequestThreadInput;

export type ReplyPullRequestThreadMutation = MutatePullRequestThreadBase & {
  action: "reply";
  threadId: number;
  content: string;
  parentCommentId?: number;
};

export type StatusPullRequestThreadMutation = MutatePullRequestThreadBase & {
  action: "status";
  threadId: number;
  status: PullRequestThreadStatus;
};

export type PullRequestThreadMutation =
  | CreatePullRequestThreadMutation
  | ReplyPullRequestThreadMutation
  | StatusPullRequestThreadMutation;

export async function mutatePullRequestThread(
  input: PullRequestThreadMutation,
): Promise<PullRequestThread[]> {
  const { auth, repositoryId } = await resolvePullRequestGitContext(input);

  if (input.action === "create") {
    await createAdoPullRequestThread(auth, repositoryId, input.pullRequestId, {
      content: input.content,
      filePath: input.filePath,
      line: input.line,
      lineSide: input.lineSide,
    });
  } else if (input.action === "reply") {
    await replyAdoPullRequestThread(
      auth,
      repositoryId,
      input.pullRequestId,
      input.threadId,
      input.content,
      input.parentCommentId ?? 1,
    );
  } else {
    await patchAdoPullRequestThreadStatus(
      auth,
      repositoryId,
      input.pullRequestId,
      input.threadId,
      input.status,
    );
  }

  return loadPullRequestThreads(input);
}
