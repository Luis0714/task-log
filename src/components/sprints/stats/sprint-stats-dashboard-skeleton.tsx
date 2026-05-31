import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
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
    >
      <Skeleton className="mb-2 h-4 w-full max-w-xl" />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Objetivos cumplidos"
          value="—"
          loading
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Parciales"
          value="—"
          loading
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="No cumplidas"
          value="—"
          loading
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Story points en objetivo"
          value="—"
          loading
          className="min-w-0 lg:col-span-3"
        />
      </div>
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
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Bugs totales"
            value="—"
            loading
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Abiertos"
            value="—"
            loading
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Atendidos"
            value="—"
            loading
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Sin asignar"
            value="—"
            loading
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Bugs en HUs del objetivo"
            value="—"
            loading
            className="min-w-0 lg:col-span-4"
          />
        </div>

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

export function SprintTimesSectionSkeleton() {
  return (
    <DashboardSection
      title="Tiempos del sprint"
      description="Horas registradas por persona, desglosadas por semana y tipo de trabajo."
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-64" />
        <div className="overflow-hidden rounded-lg border border-border/60">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="border-border/60 grid gap-3 border-b px-3 py-3 last:border-b-0 md:grid-cols-7"
            >
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 w-full" />
              ))}
            </div>
          ))}
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
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showScopeToggle ? <SprintStatsScopeToggleSkeleton /> : null}

      <div className="flex flex-col gap-6">
        <SprintGoalProgressSectionSkeleton />
        <SprintBugQualitySectionSkeleton />
        <SprintTimesSectionSkeleton />
        <DashboardDeliverySectionSkeleton />
        <DashboardWorkflowSectionSkeleton />
      </div>
    </div>
  );
}

export function SprintSnapshotBannerSkeleton() {
  return <Skeleton className="h-16 w-full rounded-lg" />;
}
