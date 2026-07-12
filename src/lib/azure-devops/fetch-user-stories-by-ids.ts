import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

const MAX_IDS_PER_REQUEST = 200;

export type UserStorySnapshot = {
  id: number;
  title: string;
  state: string;
  type: string | null;
};

/**
 * Recupera el estado actual (título + estado) de varias HUs en Azure DevOps
 * en una sola llamada batch. Si una HU fue eliminada, simplemente no aparece
 * en la respuesta — `validateLinkedNewsStories` la marca como `deleted`.
 *
 * Límite duro de Azure: ~200 IDs por request. Si la lista excede, se pagina
 * en background y se concatenan los resultados.
 */
export async function fetchUserStoriesByIds(
  auth: AdoCallerAuth,
  ids: ReadonlyArray<number>,
): Promise<UserStorySnapshot[]> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  if (uniqueIds.length === 0) return [];

  const chunks: number[][] = [];
  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    chunks.push(uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST));
  }

  const snapshots: UserStorySnapshot[] = [];
  for (const chunk of chunks) {
    const url = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${chunk.join(",")}&fields=System.Id,System.Title,System.State,System.WorkItemType&api-version=7.1`;
    const res = await adoFetch(auth, url);
    if (!res.ok) continue;
    const body = (await res.json()) as {
      value?: Array<{ id: number; fields?: Record<string, string | undefined> }>;
    };
    for (const item of body.value ?? []) {
      const title = (item.fields?.["System.Title"] ?? "").trim();
      const state = (item.fields?.["System.State"] ?? "").trim();
      const workItemType = (item.fields?.["System.WorkItemType"] ?? "").trim();
      snapshots.push({
        id: item.id,
        title: title || `Elemento de trabajo ${item.id}`,
        state,
        type: workItemType || null,
      });
    }
  }
  return snapshots;
}