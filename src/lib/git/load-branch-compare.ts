import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  listCommitsBetweenBranches,
  listFileChangesBetweenBranches,
  normalizeGitBranchName,
  resolveGitRepositoryId,
} from "@/lib/azure-devops/git";
import type { GitChangeset } from "@/lib/git/changeset";
import { isGitFilePath } from "@/lib/git/is-git-file-path";

export type LoadBranchCompareInput = {
  project: string;
  repository: string;
  source: string;
  target: string;
};

export async function loadBranchCompare(
  input: LoadBranchCompareInput,
): Promise<GitChangeset> {
  const source = normalizeGitBranchName(input.source);
  const target = normalizeGitBranchName(input.target);
  if (!source || !target || source === target) {
    return { commits: [], files: [], commonCommit: null, sourceCommit: null };
  }

  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryId = await resolveGitRepositoryId(auth, input.repository);
  const [diff, commits] = await Promise.all([
    listFileChangesBetweenBranches(auth, repositoryId, source, target),
    listCommitsBetweenBranches(auth, repositoryId, source, target),
  ]);
  const files = diff.files.filter((file) => isGitFilePath(file.path));

  return {
    commits,
    files,
    commonCommit: diff.commonCommit,
    sourceCommit: diff.sourceCommit,
  };
}
