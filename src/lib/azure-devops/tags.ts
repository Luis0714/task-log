import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";

type WorkItemTagsResponse = {
  count?: number;
  value?: Array<{
    id?: string;
    name?: string;
    lastUpdated?: string;
  }>;
};

function tagsErrorMessage(res: Response, body: string, fallback: string): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}

/** Tags definidos en el proyecto de Azure DevOps (`/_apis/wit/tags`). */
export async function listProjectWorkItemTags(
  auth: AdoCallerAuth,
): Promise<AdoWorkItemTagDto[]> {
  const url = `${adoProjectBase(auth)}/_apis/wit/tags?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      tagsErrorMessage(res, body, "No se pudieron cargar los tags del proyecto."),
    );
  }

  const data = (await res.json()) as WorkItemTagsResponse;

  return (data.value ?? [])
    .filter((tag) => tag.id && tag.name?.trim())
    .map((tag) => ({
      id: tag.id!,
      name: tag.name!.trim(),
      lastUpdated: tag.lastUpdated,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
