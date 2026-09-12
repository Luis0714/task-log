import { ReleaseStageCell } from "@/components/releases/release-stage-cell";
import type { ReleaseStage } from "@/lib/releases/types";

export type ReleaseStageStepperProps = {
  stages: readonly ReleaseStage[];
  disabled?: boolean;
  onApprove?: (stage: ReleaseStage) => void;
};

export function ReleaseStageStepper({
  stages,
  disabled,
  onApprove,
}: ReleaseStageStepperProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {stages.map((stage) => (
        <ReleaseStageCell
          key={stage.id}
          stage={stage}
          disabled={disabled}
          onApprove={onApprove}
        />
      ))}
    </div>
  );
}
