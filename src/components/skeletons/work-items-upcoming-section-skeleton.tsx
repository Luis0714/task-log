import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";

export function WorkItemsUpcomingSectionSkeleton() {
  return (
    <DashboardSection title="Próximas historias de usuario">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}
