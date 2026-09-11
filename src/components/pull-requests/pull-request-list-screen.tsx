import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { PullRequestListView } from "@/components/pull-requests/pull-request-list-view";

export type PullRequestListScreenProps = {
  title: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function PullRequestListScreen({
  title,
  searchParams,
}: PullRequestListScreenProps) {
  const catalog = await loadAssignmentsCatalog(
    parseAdoContextSearchParams(await searchParams),
  );

  return (
    <PullRequestListView
      title={title}
      project={catalog.project || catalog.defaultProject}
      team={catalog.team || catalog.defaultTeam}
    />
  );
}
