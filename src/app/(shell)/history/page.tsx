import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { CopilotHistoryView } from "@/components/copilot/copilot-history-view";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.history);

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const auth = await getServerAuthBootstrap();

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.history.title}
        description={PAGE_SEO.history.description}
        connectOptions={auth.connectOptions}
      />
    );
  }

  return <CopilotHistoryView />;
}
