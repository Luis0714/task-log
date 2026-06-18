import { Suspense } from "react";

import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { CopilotDailySectionServer } from "@/components/copilot/copilot-daily-section-server";
import { CopilotDailySectionSkeleton } from "@/components/copilot/copilot-daily-section-skeleton";
import { CopilotView } from "@/components/copilot/copilot-view";
import { CopilotPageSkeleton } from "@/components/skeletons/copilot-page-skeleton";
import { resolveSprintContextForCopilot } from "@/lib/agent/resolve-sprint-context";
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
    <Suspense fallback={<CopilotPageSkeleton />}>
      <AdoCatalogGate
        adoExecutionReady
        defaultProject={defaultProject}
        searchParams={sp}
        requiresSprint
      >
        {(catalog) => (
          <CopilotViewWithContext
            catalog={catalog}
            authMethod={auth.authMethod}
            adoExecutionReady
          />
        )}
      </AdoCatalogGate>
    </Suspense>
  );
}

async function CopilotViewWithContext({
  catalog,
  authMethod,
  adoExecutionReady,
}: {
  catalog: Parameters<
    typeof resolveSprintContextForCopilot
  >[0];
  authMethod: Parameters<typeof CopilotView>[0]["authMethod"];
  adoExecutionReady: boolean;
}) {
  const resolved = await resolveSprintContextForCopilot(catalog);
  return (
    <CopilotView
      adoExecutionReady={adoExecutionReady}
      authMethod={authMethod}
      sprintContext={resolved.ok ? resolved.context : undefined}
      dailySection={
        <Suspense
          key={`${catalog.project}|${catalog.team}|${catalog.sprintPath}`}
          fallback={<CopilotDailySectionSkeleton />}
        >
          <CopilotDailySectionServer catalog={catalog} />
        </Suspense>
      }
    />
  );
}
