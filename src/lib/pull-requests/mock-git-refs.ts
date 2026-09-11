import type { GitBranchOption } from "@/lib/git/branch-option";
import { MOCK_PULL_REQUESTS } from "@/lib/pull-requests/mock-pull-requests";
import { MOCK_RECENT_PUSHED_BRANCH } from "@/lib/pull-requests/mock-recent-pushed-branch";

function uniqueByName(options: readonly GitBranchOption[]): GitBranchOption[] {
  const seen = new Set<string>();
  const result: GitBranchOption[] = [];
  for (const option of options) {
    if (seen.has(option.name)) continue;
    seen.add(option.name);
    result.push(option);
  }
  return result;
}

export const MOCK_GIT_REPOSITORIES = [
  MOCK_RECENT_PUSHED_BRANCH.repository,
  ...MOCK_PULL_REQUESTS.map((item) => item.repository),
].filter((name, index, list) => list.indexOf(name) === index);

export const MOCK_GIT_BRANCH_OPTIONS: GitBranchOption[] = uniqueByName([
  { name: MOCK_RECENT_PUSHED_BRANCH.sourceBranch, isMine: true },
  { name: "feat/HU-drag-and-drop", isMine: true },
  { name: "feature/catalog-filters", isMine: true },
  { name: "feature/auth-v2", isMine: true },
  { name: "hotfix/env", isMine: true },
  { name: "develop", isDefault: true },
  { name: MOCK_RECENT_PUSHED_BRANCH.targetBranch },
  { name: "staging" },
  { name: "azure-pipelines_mm" },
  { name: "bug/270572" },
  ...MOCK_PULL_REQUESTS.flatMap((item) => [
    { name: item.sourceBranch, isMine: item.isMine },
    { name: item.targetBranch },
  ]),
]);

export const MOCK_GIT_BRANCHES = MOCK_GIT_BRANCH_OPTIONS.map((option) => option.name);

export const DEFAULT_TARGET_BRANCH = "main";
