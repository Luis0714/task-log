import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { CopilotHistoryViewWithDaily } from "@/components/copilot/copilot-history-view-with-daily";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.history);

export const dynamic = "force-dynamic";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HistoryPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } =
    await resolvePageAuth(searchParams);

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.history.title}
        description={PAGE_SEO.history.description}
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
      requiresSprint={false}
    >
      {(catalog) => <CopilotHistoryViewWithDaily catalog={catalog} />}
    </AdoCatalogGate>
  );
}
