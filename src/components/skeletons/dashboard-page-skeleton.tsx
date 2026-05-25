import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import {
  DashboardDailySectionSkeleton,
  DashboardDeliverySectionSkeleton,
  DashboardHoursSectionSkeleton,
  DashboardWorkflowSectionSkeleton,
} from "@/components/skeletons/dashboard-section-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Shell del dashboard (cabecera + filtros). Las secciones usan sus propios skeletons en Suspense. */
export function DashboardPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-6 pb-6", className)}>
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full max-w-3xl rounded-lg" />
      <DashboardDeliverySectionSkeleton />
      <DashboardHoursSectionSkeleton />
      <DashboardWorkflowSectionSkeleton />
      <DashboardDailySectionSkeleton />
    </div>
  );
}
