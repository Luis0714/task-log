import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";

export function WorkItemsAllSectionSkeleton() {
  return (
    <DashboardSection title="Historias de usuario">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}
