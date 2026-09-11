import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.releases);

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const { title, description } = PAGE_SEO.releases;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <ComingSoonPage title={title} description={description} />
    </SuperAdminPageShell>
  );
}
