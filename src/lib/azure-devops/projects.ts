import { adoFetch, adoOrgBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type AdoProject = {
  id: string;
  name: string;
  description?: string;
};

type ProjectsResponse = {
  value?: Array<{
    id?: string;
    name?: string;
    description?: string;
    state?: string;
  }>;
};

export function withAdoProject(auth: AdoCallerAuth, project: string): AdoCallerAuth {
  return { ...auth, project: project.trim() };
}

export async function listOrganizationProjects(auth: AdoCallerAuth): Promise<AdoProject[]> {
  const url = `${adoOrgBase(auth)}/_apis/projects?api-version=7.1&$top=100&stateFilter=WellFormed`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 300) || "No se pudieron cargar los proyectos.");
  }

  const data = (await res.json()) as ProjectsResponse;
  return (data.value ?? [])
    .filter((project) => project.id && project.name)
    .map((project) => ({
      id: project.id!,
      name: project.name!,
      description: project.description,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
