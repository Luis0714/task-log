import "server-only";

import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";

export async function resolvePageCatalog(
  adoExecutionReady: boolean,
  defaultProject: string | null,
  searchParams: AdoContextSearchParams = {},
): Promise<AdoCatalogSnapshot> {
  if (!adoExecutionReady) {
    return loadAdoCatalog(null, {});
  }
  return loadAdoCatalog(defaultProject, searchParams);
}
