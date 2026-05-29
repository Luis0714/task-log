import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsProcessProfilePanel } from "@/components/settings/settings-process-profile-panel";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { loadSettingsPageData } from "@/lib/settings/load-settings-page-data";
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

  const data = await loadSettingsPageData();

  if (!data) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
        <PageHeader title={PAGE_SEO.settings.title} description={PAGE_SEO.settings.description} />
        <p className="text-muted-foreground text-sm">
          Conecta Azure DevOps y elige un proyecto para configurar NeosView.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-6">
      <PageHeader title={PAGE_SEO.settings.title} description={PAGE_SEO.settings.description} />
      <SettingsProcessProfilePanel data={data} />
    </div>
  );
}
