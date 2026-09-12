import { notFound } from "next/navigation";

import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { PullRequestDetailScreen } from "@/components/pull-requests/pull-request-detail-screen";
import { parsePullRequestId } from "@/lib/pull-requests/detail-path";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const dynamic = "force-dynamic";

type PageProps = {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const pullRequestId = parsePullRequestId(id);
  return buildPageMetadata({
    ...PAGE_SEO.pullRequestDetail,
    title: pullRequestId
      ? `Pull Request #${pullRequestId}`
      : PAGE_SEO.pullRequestDetail.title,
    path: `/pull-requests/${id}`,
  });
}

export default async function PullRequestDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const pullRequestId = parsePullRequestId(id);
  if (!pullRequestId) notFound();

  const { title, description } = PAGE_SEO.pullRequestDetail;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <PullRequestDetailScreen
        pullRequestId={pullRequestId}
        searchParams={await searchParams}
      />
    </SuperAdminPageShell>
  );
}
