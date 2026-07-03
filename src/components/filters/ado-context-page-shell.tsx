"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { AdoFiltersSection } from "@/components/filters/ado-filters-section";
import { PageHeader } from "@/components/layout/page-header";
import { useAdoContextPage } from "@/hooks/filters/use-ado-context-page";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { cn } from "@/lib/utils";

export type AdoContextPageShellProps = {
  title: string;
  description: string;
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  headerAction?: ReactNode;
  headerMeta?: ReactNode;
  filtersExtra?: ReactNode;
  filtersSummaryExtra?: string;
  filtersDefaultOpen?: boolean;
  filtersTitle?: string;
  filtersClassName?: string;
  children?: ReactNode;
};

export function AdoContextPageShell({
  title,
  description,
  catalog,
  adoExecutionReady,
  headerAction,
  headerMeta,
  filtersExtra,
  filtersSummaryExtra,
  filtersDefaultOpen = false,
  filtersTitle = "Filtros",
  filtersClassName,
  children = null,
}: AdoContextPageShellProps) {
  const { context, catalogError } = useAdoContextPage({
    catalog,
    adoExecutionReady,
  });

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <PageHeader
        title={title}
        description={description}
        meta={headerMeta}
        action={headerAction}
      />

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {adoExecutionReady ? (
        <AdoFiltersSection
          context={context}
          extra={filtersExtra}
          summaryExtra={filtersSummaryExtra}
          defaultOpen={filtersDefaultOpen}
          collapsibleTitle={filtersTitle}
          className={cn("max-w-3xl", filtersClassName)}
        />
      ) : null}

      {children}
    </div>
  );
}
