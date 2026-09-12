import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { loadSessionDefaultRepository } from "@/lib/ado/load-session-default-repository";
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
  const [catalog, defaultRepository] = await Promise.all([
    loadAssignmentsCatalog(parseAdoContextSearchParams(await searchParams)),
    loadSessionDefaultRepository(),
  ]);

  return (
    <PullRequestListView
      title={title}
      project={catalog.project || catalog.defaultProject}
      team={catalog.team || catalog.defaultTeam}
      defaultRepository={defaultRepository}
    />
  );
}
