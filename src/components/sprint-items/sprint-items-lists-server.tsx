import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { SprintItemsListsBridge } from "@/components/sprint-items/sprint-items-lists-bridge";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadSprintItemsData } from "@/lib/sprint-items/load-sprint-items-data";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type SprintItemsListsServerProps = {
  kind: SprintItemsKind;
  catalog: AdoCatalogSnapshot;
  assignee: string;
};

export async function SprintItemsListsServer({
  kind,
  catalog,
  assignee,
}: SprintItemsListsServerProps) {
  const snapshot = await loadSprintItemsData({
    kind,
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    assignee: assignee || DEFAULT_WORK_ITEM_FILTERS.assignee,
  });

  if (snapshot.error) {
    return <CopilotErrorAlert message={snapshot.error} />;
  }

  return (
    <SprintItemsListsBridge kind={kind} catalog={catalog} snapshot={snapshot} />
  );
}
