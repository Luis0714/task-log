import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { loadSessionDefaultRepository } from "@/lib/ado/load-session-default-repository";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { PullRequestCreateView } from "@/components/pull-requests/pull-request-create-view";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";

export type PullRequestCreateScreenProps = Readonly<{
  title: string;
  searchParams: Record<string, string | string[] | undefined>;
  initialQuery: NewPullRequestQuery;
}>;

export async function PullRequestCreateScreen({
  title,
  searchParams,
  initialQuery,
}: PullRequestCreateScreenProps) {
  const [catalog, defaultRepository] = await Promise.all([
    loadAssignmentsCatalog(parseAdoContextSearchParams(searchParams)),
    loadSessionDefaultRepository(),
  ]);

  return (
    <PullRequestCreateView
      title={title}
      initialQuery={initialQuery}
      defaultRepository={defaultRepository}
      project={catalog.project || catalog.defaultProject}
      team={catalog.team || catalog.defaultTeam}
    />
  );
}
