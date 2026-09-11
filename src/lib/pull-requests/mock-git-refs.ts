import { MOCK_PULL_REQUESTS } from "@/lib/pull-requests/mock-pull-requests";
import { MOCK_RECENT_PUSHED_BRANCH } from "@/lib/pull-requests/mock-recent-pushed-branch";

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export const MOCK_GIT_REPOSITORIES = unique([
  MOCK_RECENT_PUSHED_BRANCH.repository,
  ...MOCK_PULL_REQUESTS.map((item) => item.repository),
]);

export const MOCK_GIT_BRANCHES = unique([
  MOCK_RECENT_PUSHED_BRANCH.sourceBranch,
  MOCK_RECENT_PUSHED_BRANCH.targetBranch,
  ...MOCK_PULL_REQUESTS.flatMap((item) => [item.sourceBranch, item.targetBranch]),
]);

export const DEFAULT_TARGET_BRANCH = "main";
