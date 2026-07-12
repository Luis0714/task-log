"use client";

import { AdoContextPageShell } from "@/components/filters/ado-context-page-shell";
import { ReportsTimeLogContent } from "@/components/reports/time-log/reports-time-log-content";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { PAGE_SEO } from "@/lib/seo/pages";

export type ReportsTimeLogPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  initialScopes: { projectIds: string[]; teamIds: string[] };
};

export function ReportsTimeLogPageShell({
  catalog,
  adoExecutionReady,
  initialScopes,
}: Readonly<ReportsTimeLogPageShellProps>) {
  return (
    <AdoContextPageShell
      title={PAGE_SEO.reportsTimeLog.title}
      description={PAGE_SEO.reportsTimeLog.description}
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
    >
      <ReportsTimeLogContent
        catalog={catalog}
        initialScopes={initialScopes}
      />
    </AdoContextPageShell>
  );
}