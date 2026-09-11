import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.pullRequests);

export const dynamic = "force-dynamic";

export default async function PullRequestsPage() {
  const { title, description } = PAGE_SEO.pullRequests;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <ComingSoonPage title={title} description={description} />
    </SuperAdminPageShell>
  );
}
