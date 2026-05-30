import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";
import {
  DashboardDailySectionSkeleton,
  DashboardDeliverySectionSkeleton,
  DashboardHoursSectionSkeleton,
  DashboardWorkflowSectionSkeleton,
} from "@/components/skeletons/dashboard-section-skeletons";
import { cn } from "@/lib/utils";

export type DashboardPageSkeletonProps = {
  className?: string;
};

/** Shell + secciones del dashboard mientras carga la sesión o el catálogo ADO. */
export function DashboardPageSkeleton({ className }: DashboardPageSkeletonProps) {
  return (
    <div className={cn("flex min-h-0 w-full flex-1 flex-col gap-6 pb-6", className)}>
      <DashboardShellSkeleton />
      <div className="flex flex-col gap-6">
        <DashboardDeliverySectionSkeleton />
        <DashboardHoursSectionSkeleton />
        <DashboardWorkflowSectionSkeleton />
        <DashboardDailySectionSkeleton />
      </div>
    </div>
  );
}
