"use client";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { SprintsPageContent } from "@/components/sprints/sprints-page-content";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";
import { PAGE_SEO } from "@/lib/seo/pages";

export type SprintsPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
};

export function SprintsPageShell({
  catalog,
  adoExecutionReady,
}: SprintsPageShellProps) {
  const currentSprint = resolveCurrentSprint(catalog);

  return (
    <AdoContextPageShell
      title={PAGE_SEO.sprints.title}
      description={PAGE_SEO.sprints.description}
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
      filtersDefaultOpen
    >
      <SprintsPageContent sprint={currentSprint} />
    </AdoContextPageShell>
  );
}
