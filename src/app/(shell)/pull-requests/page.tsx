import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { PullRequestListScreen } from "@/components/pull-requests/pull-request-list-screen";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.pullRequests);

export const dynamic = "force-dynamic";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PullRequestsPage({ searchParams }: PageProps) {
  const { title, description } = PAGE_SEO.pullRequests;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <PullRequestListScreen title={title} searchParams={searchParams} />
    </SuperAdminPageShell>
  );
}
