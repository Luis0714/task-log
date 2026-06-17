import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";
import {
  DashboardDeliverySectionSkeleton,
  DashboardHoursSectionSkeleton,
  DashboardWorkflowSectionSkeleton,
} from "@/components/skeletons/dashboard-section-skeletons";
import { cn } from "@/lib/utils";

const BASE_CLASS_NAME = "flex min-h-0 w-full flex-1 flex-col gap-6 pb-6";

export type DashboardPageSkeletonProps = {
  className?: string;
};
export function DashboardPageSkeleton({
  className,
}: Readonly<DashboardPageSkeletonProps>) {
  const wrapperClassName = className ? cn(BASE_CLASS_NAME, className) : BASE_CLASS_NAME;
  return (
    <div className={wrapperClassName}>
      <DashboardShellSkeleton />
      <div className="flex flex-col gap-6">
        <DashboardDeliverySectionSkeleton />
        <DashboardHoursSectionSkeleton />
        <DashboardWorkflowSectionSkeleton />
      </div>
    </div>
  );
}
