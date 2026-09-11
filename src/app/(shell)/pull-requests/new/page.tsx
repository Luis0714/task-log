import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { PullRequestCreateView } from "@/components/pull-requests/pull-request-create-view";
import { parseNewPullRequestQuery } from "@/lib/pull-requests/create-query";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.pullRequestNew);

export const dynamic = "force-dynamic";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewPullRequestPage({ searchParams }: PageProps) {
  const { title, description } = PAGE_SEO.pullRequestNew;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <PullRequestCreateView
        title={title}
        initialQuery={parseNewPullRequestQuery(await searchParams)}
      />
    </SuperAdminPageShell>
  );
}
