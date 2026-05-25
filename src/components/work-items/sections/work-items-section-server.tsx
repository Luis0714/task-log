import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import {
  WorkItemsFilteredSectionClient,
  type WorkItemsSectionKey,
} from "@/components/work-items/work-items-filtered-section-client";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadWorkItemsBase } from "@/lib/work-items/load-work-items-base";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type WorkItemsSectionServerProps = {
  catalog: AdoCatalogSnapshot;
  assignee: string;
  section: WorkItemsSectionKey;
};

export async function WorkItemsSectionServer({
  catalog,
  assignee,
  section,
}: WorkItemsSectionServerProps) {
  const base = await loadWorkItemsBase(
    catalog,
    assignee || DEFAULT_WORK_ITEM_FILTERS.assignee,
  );

  if (base.error) {
    return <CopilotErrorAlert message={base.error} />;
  }

  return <WorkItemsFilteredSectionClient base={base} section={section} />;
}
