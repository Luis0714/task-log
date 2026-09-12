import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import {
  listAdoPendingReleaseApprovals,
  listAdoReleaseDefinitions,
  listAdoReleases,
} from "@/lib/azure-devops/releases";
import {
  mapAdoRelease,
  mapAdoReleaseDefinitions,
  pickDefaultReleaseDefinition,
} from "@/lib/releases/map-ado-release";
import type { ReleaseListSnapshot } from "@/lib/releases/types";

export type LoadReleaseListInput = {
  project: string;
  definitionId?: number;
};

export async function loadReleaseList(
  input: LoadReleaseListInput,
): Promise<ReleaseListSnapshot> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const [rawDefinitions, profile] = await Promise.all([
    listAdoReleaseDefinitions(auth),
    resolveAdoProfile(auth, { persist: true }),
  ]);
  const definitions = mapAdoReleaseDefinitions(rawDefinitions);
  const definitionId = input.definitionId ?? pickDefaultReleaseDefinition(definitions);
  if (!definitionId) {
    return { definitions, items: [], pendingCount: 0, definitionId: null };
  }

  const [releases, pending] = await Promise.all([
    listAdoReleases(auth, definitionId),
    listAdoPendingReleaseApprovals(auth),
  ]);
  const currentUserId = profile?.id ?? null;
  const items = releases
    .map((release) => mapAdoRelease(release, pending, currentUserId))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    definitions,
    items,
    pendingCount: items.filter((item) => item.pendingCount > 0).length,
    definitionId,
  };
}
