import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";

export function WorkItemsInProgressSectionSkeleton() {
  return (
    <DashboardSection title="Historias en progreso">
      <PbiListSkeleton variant="featured" />
    </DashboardSection>
  );
}
