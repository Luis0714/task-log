import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";

export function WorkItemsDevelopedSectionSkeleton() {
  return (
    <DashboardSection title="Historias desarrolladas">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}
