import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { PullRequestListView } from "@/components/pull-requests/pull-request-list-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.pullRequests);

export const dynamic = "force-dynamic";

export default async function PullRequestsPage() {
  const { title, description } = PAGE_SEO.pullRequests;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <PullRequestListView title={title} />
    </SuperAdminPageShell>
  );
}
