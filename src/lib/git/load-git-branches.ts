import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { listGitBranchNames, resolveGitRepositoryId } from "@/lib/azure-devops/git";

export async function loadGitBranches(
  project: string,
  repository: string,
): Promise<string[]> {
  if (!project.trim() || !repository.trim()) return [];
  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];
  const repositoryId = await resolveGitRepositoryId(auth, repository);
  return listGitBranchNames(auth, repositoryId);
}
