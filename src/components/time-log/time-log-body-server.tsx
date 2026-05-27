import { TimeLogBodyClient } from "@/components/time-log/time-log-body-client";
import { loadTimeLogPbis } from "@/lib/time-log/load-time-log-pbis";
import type { TimeLogServerBaseline } from "@/lib/time-log/load-time-log-baseline";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export type TimeLogBodyServerProps = {
  adoExecutionReady: boolean;
  defaultProject: string | null;
  serverBaseline: TimeLogServerBaseline;
  urlAssignee: string;
};

export async function TimeLogBodyServer({
  adoExecutionReady,
  defaultProject,
  serverBaseline,
  urlAssignee,
}: TimeLogBodyServerProps) {
  const { catalog } = serverBaseline;
  const pbisSnapshot = await loadTimeLogPbis(
    catalog.project,
    catalog.sprintPath,
    urlAssignee || DEFAULT_WORK_ITEM_FILTERS.assignee,
  );

  return (
    <TimeLogBodyClient
      adoExecutionReady={adoExecutionReady}
      defaultProject={defaultProject}
      serverBaseline={serverBaseline}
      pbisSnapshot={pbisSnapshot}
    />
  );
}
