import { ReleaseListView } from "@/components/releases/release-list-view";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";

export type ReleaseListScreenProps = {
  title: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function ReleaseListScreen({
  title,
  searchParams,
}: ReleaseListScreenProps) {
  const catalog = await loadAssignmentsCatalog(
    parseAdoContextSearchParams(await searchParams),
  );

  return (
    <ReleaseListView
      title={title}
      project={catalog.project || catalog.defaultProject}
    />
  );
}
