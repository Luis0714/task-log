import { PullRequestSideSection } from "@/components/pull-requests/pull-request-side-section";
import { PbiStateDot } from "@/components/work-items/pbi-state-dot";
import { WorkItemKindIcon } from "@/components/work-items/work-item-kind-icon";
import type { PullRequestDetailWorkItem } from "@/lib/pull-requests/detail-types";

export type PullRequestWorkItemsCardProps = {
  workItems: readonly PullRequestDetailWorkItem[];
};

export function PullRequestWorkItemsCard({ workItems }: PullRequestWorkItemsCardProps) {
  return (
    <PullRequestSideSection
      title="Work items"
      empty={workItems.length === 0}
      emptyLabel="Sin work items"
    >
      <ul className="flex flex-col gap-2">
        {workItems.map((item) => (
          <li key={item.id} className="flex min-w-0 items-start gap-2">
            <WorkItemKindIcon kind={item.kind} className="mt-0.5" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={item.title}>
                #{item.id} {item.title}
              </p>
              {item.state ? (
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                  <PbiStateDot state={item.state} className="size-2" />
                  {item.state}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </PullRequestSideSection>
  );
}
