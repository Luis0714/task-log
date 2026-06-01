import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { WorkItemTagsReadonly } from "@/components/work-items/work-item-tags-readonly";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { parseGoalTagNames } from "@/lib/sprints/goal-tags-serialization";
import { cn } from "@/lib/utils";

const MUTED_TAG_CLASS = "text-muted-foreground text-xs";

const LABEL_CLASS = "text-muted-foreground shrink-0 text-xs font-medium";

type SprintGoalObjectiveMetaActualProps = {
  targetStateName: string | null;
  targetTacTagName: string | null;
  finalStateName: string | null;
  finalTacTagName: string | null;
  className?: string;
};

function InlineMetaActual({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function renderActualState(finalState: string) {
  if (finalState) {
    return <WorkItemStateBadge state={finalState} className="max-w-full" />;
  }

  return (
    <Badge variant="outline" className="text-muted-foreground text-xs">
      Sin estado
    </Badge>
  );
}

export function SprintGoalObjectiveMetaActual({
  targetStateName,
  targetTacTagName,
  finalStateName,
  finalTacTagName,
  className,
}: SprintGoalObjectiveMetaActualProps) {
  const targetState = targetStateName?.trim() ?? "";
  const targetTags = parseGoalTagNames(targetTacTagName);
  const finalState = finalStateName?.trim() ?? "";
  const finalTags = parseGoalTagNames(finalTacTagName);

  const objectiveInvolvesTag = targetTags.length > 0;

  const metaContent: ReactNode = objectiveInvolvesTag ? (
    targetTags.length > 0 ? (
      <WorkItemTagsReadonly tags={targetTags} />
    ) : null
  ) : targetState ? (
    <WorkItemStateBadge state={targetState} className="max-w-full" />
  ) : null;

  const actualContent: ReactNode = objectiveInvolvesTag ? (
    <>
      {renderActualState(finalState)}
      {finalTags.length > 0 ? (
        <WorkItemTagsReadonly tags={finalTags} className="mt-1" />
      ) : (
        <span className={cn(MUTED_TAG_CLASS, "mt-1 block")}>Sin tags</span>
      )}
    </>
  ) : (
    renderActualState(finalState)
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {metaContent ? <InlineMetaActual label="Meta">{metaContent}</InlineMetaActual> : null}
      <InlineMetaActual label="Actual">{actualContent}</InlineMetaActual>
    </div>
  );
}
