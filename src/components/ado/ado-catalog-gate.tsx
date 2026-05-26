import type { ReactNode } from "react";

import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";

export type AdoCatalogGateProps = {
  adoExecutionReady: boolean;
  defaultProject: string | null;
  searchParams: AdoContextSearchParams;
  requiresSprint?: boolean;
  children: (catalog: AdoCatalogSnapshot) => ReactNode;
};

export async function AdoCatalogGate({
  adoExecutionReady,
  defaultProject,
  searchParams,
  requiresSprint = true,
  children,
}: AdoCatalogGateProps) {
  const catalog = await resolvePageCatalog(
    adoExecutionReady,
    defaultProject,
    searchParams,
  );

  if (requiresSprint && !catalog.sprintPath) return null;

  return children(catalog);
}
