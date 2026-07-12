"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsTimeLogContent } from "@/components/reports/time-log/reports-time-log-content";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { PAGE_SEO } from "@/lib/seo/pages";

export type ReportsTimeLogPageShellProps = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  initialScopes: { projectIds: string[]; teamIds: string[] };
  catalogError?: string | null;
};

export function ReportsTimeLogPageShell({
  catalog,
  adoExecutionReady,
  initialScopes,
  catalogError,
}: Readonly<ReportsTimeLogPageShellProps>) {
  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <PageHeader
        title={PAGE_SEO.reportsTimeLog.title}
        description={PAGE_SEO.reportsTimeLog.description}
      />
      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}
      <ReportsTimeLogContent
        catalog={catalog}
        initialScopes={initialScopes}
        adoExecutionReady={adoExecutionReady}
      />
    </div>
  );
}