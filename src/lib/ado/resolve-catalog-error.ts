import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export function resolveCatalogError(catalog: AdoCatalogSnapshot): string | null {
  return (
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null
  );
}
