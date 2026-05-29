import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { ViewPlaceholder } from "@/components/layout/view-placeholder";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.settings);

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auth = await getServerAuthBootstrap();

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.settings.title}
        description={PAGE_SEO.settings.description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <ViewPlaceholder
      title={PAGE_SEO.settings.title}
      description={PAGE_SEO.settings.description}
    />
  );
}
