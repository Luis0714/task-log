import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { ProgressRingSkeleton } from "@/components/dashboard/metrics/progress-ring/progress-ring-skeleton";
import {
  PROGRESS_RING_PAIR_CELL_CLASS,
  ProgressRingPairGrid,
} from "@/components/dashboard/metrics/progress-ring/progress-ring-pair-grid";
import {
  DashboardDeliverySectionSkeleton,
  DashboardWorkflowSectionSkeleton,
} from "@/components/skeletons/dashboard-section-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SprintStatsScopeToggleSkeletonProps = {
  className?: string;
};

export function SprintStatsScopeToggleSkeleton({ className }: SprintStatsScopeToggleSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="size-4 rounded-[4px]" />
      <Skeleton className="h-4 w-52 max-w-full" />
    </div>
  );
}

export function SprintGoalProgressSectionSkeleton() {
  return (
    <DashboardSection
      title="Cumplimiento del objetivo"
      description="Avance del equipo respecto al objetivo definido para este sprint."
      contentClassName="flex flex-col gap-3"
    >
      <Skeleton className="h-4 w-full max-w-xl" />

      <ProgressRingPairGrid>
        <div
          className={cn(
            PROGRESS_RING_PAIR_CELL_CLASS,
            "rounded-lg border border-border/60 p-3",
          )}
        >
          <ProgressRingSkeleton />
        </div>

        <DashboardKpi
          size="featured"
          layout="stack"
          label="Cumplidas / comprometidas"
          value="—"
          hint="— SP"
          loading
          className={PROGRESS_RING_PAIR_CELL_CLASS}
        />
      </ProgressRingPairGrid>
    </DashboardSection>
  );
}

function BugDetailRowSkeleton() {
  return (
    <div className="grid gap-2 px-3 py-2.5 md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,10rem)_minmax(0,8rem)_minmax(0,1fr)] md:items-center md:gap-3">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function SprintBugQualitySectionSkeleton() {
  return (
    <DashboardSection
      title="Calidad — Bugs del sprint"
      description="Estado de bugs del equipo y su relación con historias del objetivo."
    >
      <div className="flex flex-col gap-3">
        <ProgressRingPairGrid>
          <div
            className={cn(
              PROGRESS_RING_PAIR_CELL_CLASS,
              "rounded-lg border border-border/60 p-3",
            )}
          >
            <ProgressRingSkeleton />
          </div>

          <DashboardKpi
            size="featured"
            layout="stack"
            label="Bugs en HUs del objetivo"
            value="—"
            loading
            className={PROGRESS_RING_PAIR_CELL_CLASS}
          />
        </ProgressRingPairGrid>

        <div className="grid gap-3 lg:grid-cols-12">
          <Skeleton className="h-52 rounded-xl lg:col-span-7" />
          <Skeleton className="h-52 rounded-xl lg:col-span-5" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="overflow-hidden rounded-lg border border-border/60">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-border/60 border-b last:border-b-0">
                <BugDetailRowSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}

export type SprintStatsDashboardSkeletonProps = {
  showScopeToggle?: boolean;
  className?: string;
};

export function SprintStatsDashboardSkeleton({
  showScopeToggle = false,
  className,
}: SprintStatsDashboardSkeletonProps) {
  const showGoalSections = false;
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showScopeToggle ? <SprintStatsScopeToggleSkeleton /> : null}

      <div className="flex flex-col gap-6">
        { showGoalSections && <>
        <DashboardDeliverySectionSkeleton />
        <DashboardWorkflowSectionSkeleton />
        <SprintGoalProgressSectionSkeleton />
        <SprintBugQualitySectionSkeleton />
        </> }
      </div>
    </div>
  );
}

export function SprintSnapshotBannerSkeleton() {
  return <Skeleton className="h-16 w-full rounded-lg" />;
}
