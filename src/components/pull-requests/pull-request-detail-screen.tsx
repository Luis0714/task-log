import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { PullRequestDetailView } from "@/components/pull-requests/pull-request-detail-view";

export type PullRequestDetailScreenProps = {
  pullRequestId: number;
  searchParams: Record<string, string | string[] | undefined>;
};

function readRepository(
  searchParams: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw = searchParams.repository;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}

export async function PullRequestDetailScreen({
  pullRequestId,
  searchParams,
}: PullRequestDetailScreenProps) {
  const catalog = await loadAssignmentsCatalog(parseAdoContextSearchParams(searchParams));

  return (
    <PullRequestDetailView
      project={catalog.project || catalog.defaultProject}
      pullRequestId={pullRequestId}
      repository={readRepository(searchParams)}
    />
  );
}
