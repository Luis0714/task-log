import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { NeosIaView } from "@/components/neos-ia/neos-ia-view";
import { NeosIaPageSkeleton } from "@/components/skeletons/neos-ia-page-skeleton";
import { resolveSprintContextForCopilot } from "@/lib/agent/resolve-sprint-context";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuthWithProfile } from "@/lib/auth/resolve-page-auth";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.neosIa);

export const dynamic = "force-dynamic";

const NEOS_IA_DESCRIPTION =
  "Describe qué hiciste en lenguaje natural. Siempre verás una vista previa antes de ejecutar en Azure DevOps.";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NeosIaPage({ searchParams }: PageProps) {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isAdmin) redirect("/");

  const { searchParams: sp, auth, defaultProject } =
    await resolvePageAuthWithProfile(searchParams);

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title="Neos IA"
        description={NEOS_IA_DESCRIPTION}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <Suspense fallback={<NeosIaPageSkeleton />}>
      <AdoCatalogGate
        adoExecutionReady
        defaultProject={defaultProject}
        searchParams={sp}
        requiresSprint
      >
        {(catalog) => (
          <NeosIaViewWithContext
            catalog={catalog}
            authMethod={auth.authMethod}
            adoExecutionReady
          />
        )}
      </AdoCatalogGate>
    </Suspense>
  );
}

async function NeosIaViewWithContext({
  catalog,
  authMethod,
  adoExecutionReady,
}: Readonly<{
  catalog: Parameters<typeof resolveSprintContextForCopilot>[0];
  authMethod: Parameters<typeof NeosIaView>[0]["authMethod"];
  adoExecutionReady: boolean;
}>) {
  const resolved = await resolveSprintContextForCopilot(catalog);
  return (
    <NeosIaView
      adoExecutionReady={adoExecutionReady}
      authMethod={authMethod}
      sprintContext={resolved.ok ? resolved.context : undefined}
    />
  );
}