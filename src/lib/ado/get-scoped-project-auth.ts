import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { withAdoProject } from "@/lib/azure-devops/projects";

export const getScopedProjectAuth = cache(async function getScopedProjectAuth(
  project: string,
): Promise<AdoCallerAuth | null> {
  const caller = await requireAdoCaller();
  if (!caller.ok || !project.trim()) return null;
  return withAdoProject(caller.auth, project);
});
