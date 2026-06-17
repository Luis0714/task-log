import { Suspense } from "react";

import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { CopilotDailySectionServer } from "@/components/copilot/copilot-daily-section-server";
import { CopilotDailySectionSkeleton } from "@/components/copilot/copilot-daily-section-skeleton";
import { CopilotView } from "@/components/copilot/copilot-view";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.copilot);

export const dynamic = "force-dynamic";

const COPILOT_DESCRIPTION =
  "Describe qué hiciste en lenguaje natural. Siempre verás una vista previa antes de ejecutar en Azure DevOps.";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CopilotPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } =
    await resolvePageAuth(searchParams);

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title="Copiloto IA"
        description={COPILOT_DESCRIPTION}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <AdoCatalogGate
      adoExecutionReady
      defaultProject={defaultProject}
      searchParams={sp}
      requiresSprint
    >
      {(catalog) => (
        <CopilotView
          adoExecutionReady
          authMethod={auth.authMethod}
          dailySection={
            <Suspense
              key={`${catalog.project}|${catalog.team}|${catalog.sprintPath}`}
              fallback={<CopilotDailySectionSkeleton />}
            >
              <CopilotDailySectionServer catalog={catalog} />
            </Suspense>
          }
        />
      )}
    </AdoCatalogGate>
  );
}
