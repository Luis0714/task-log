import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveGitRepositoryId } from "@/lib/azure-devops/git";
import { getAdoPullRequestById } from "@/lib/azure-devops/pull-request-detail";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type PullRequestGitContext = {
  auth: AdoCallerAuth;
  repositoryId: string;
  repositoryName: string;
};

export type ResolvePullRequestGitContextInput = {
  project: string;
  pullRequestId: number;
  repository?: string;
};

export async function resolvePullRequestGitContext(
  input: ResolvePullRequestGitContextInput,
): Promise<PullRequestGitContext> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryName = input.repository?.trim() ?? "";
  if (repositoryName) {
    return {
      auth,
      repositoryId: await resolveGitRepositoryId(auth, repositoryName),
      repositoryName,
    };
  }

  const raw = await getAdoPullRequestById(auth, input.pullRequestId);
  const repositoryId = raw.repository?.id?.trim();
  const resolvedName = raw.repository?.name?.trim();
  if (!repositoryId || !resolvedName) {
    throw new Error("Azure DevOps no devolvió el repositorio del pull request.");
  }
  return { auth, repositoryId, repositoryName: resolvedName };
}
