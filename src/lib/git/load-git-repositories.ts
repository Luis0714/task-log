import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { listGitRepositories } from "@/lib/azure-devops/git";

export async function loadGitRepositories(project: string): Promise<string[]> {
  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];
  const repositories = await listGitRepositories(auth);
  return repositories.map((item) => item.name);
}
