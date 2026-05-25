import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { WorkItemsListsBridge } from "@/components/work-items/work-items-lists-bridge";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadWorkItemsLists } from "@/lib/work-items/load-work-items-lists";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type WorkItemsListsServerProps = {
  catalog: AdoCatalogSnapshot;
  assignee: string;
  currentUserDisplayName?: string | null;
};

export async function WorkItemsListsServer({
  catalog,
  assignee,
  currentUserDisplayName = null,
}: WorkItemsListsServerProps) {
  const lists = await loadWorkItemsLists({
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    assignee: assignee || DEFAULT_WORK_ITEM_FILTERS.assignee,
  });

  if (lists.error) {
    return <CopilotErrorAlert message={lists.error} />;
  }

  return (
    <WorkItemsListsBridge
      lists={lists}
      project={catalog.project || null}
      team={catalog.team || null}
      currentUserDisplayName={currentUserDisplayName}
    />
  );
}
