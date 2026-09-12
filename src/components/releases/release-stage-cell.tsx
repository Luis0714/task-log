"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RELEASE_STAGE_STATUS_TONE,
  releaseStageTooltip,
} from "@/lib/releases/stage-status";
import type { ReleaseStage } from "@/lib/releases/types";
import { cn } from "@/lib/utils";

export type ReleaseStageCellProps = {
  stage: ReleaseStage;
  onApprove?: (stage: ReleaseStage) => void;
  disabled?: boolean;
};

export function ReleaseStageCell({
  stage,
  onApprove,
  disabled,
}: ReleaseStageCellProps) {
  const interactive = stage.canApprove && stage.approvalId != null;
  const className = cn(
    "inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
    RELEASE_STAGE_STATUS_TONE[stage.status],
    interactive &&
      "animate-release-approve-pulse cursor-pointer hover:scale-105 hover:bg-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-400",
  );
  const tooltip = releaseStageTooltip(stage);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={className}
            disabled={interactive ? disabled : undefined}
            aria-label={tooltip}
            onClick={interactive ? () => onApprove?.(stage) : undefined}
          />
        }
      >
        {stage.shortName}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
