import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { PageHeader } from "@/components/layout/page-header";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import type { PageSeoEntry } from "@/lib/seo/pages";

type AnalysisPageContentProps = {
  seo: PageSeoEntry;
};

export async function AnalysisPageContent({ seo }: AnalysisPageContentProps) {
  const auth = await getServerAuthBootstrap();

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={seo.title}
        description={seo.description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader title={seo.title} description={seo.description} />
    </div>
  );
}
