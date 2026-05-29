import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export function buildProcessProfileKey(organization: string, project: string): string {
  return `${organization.trim()}::${project.trim()}`;
}

export function buildProcessProfileKeyFromAuth(auth: AdoCallerAuth): string {
  return buildProcessProfileKey(auth.organization, auth.project);
}
