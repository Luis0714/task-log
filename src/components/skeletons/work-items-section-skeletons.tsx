import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { PbiListSkeleton } from "@/components/skeletons/pbi-list-skeleton";

export function WorkItemsAllSectionSkeleton() {
  return (
    <DashboardSection title="Historias de usuario">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}

export function WorkItemsInProgressSectionSkeleton() {
  return (
    <DashboardSection title="Historias en progreso">
      <PbiListSkeleton variant="featured" />
    </DashboardSection>
  );
}

export function WorkItemsUpcomingSectionSkeleton() {
  return (
    <DashboardSection title="Próximas historias de usuario">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}

export function WorkItemsDevelopedSectionSkeleton() {
  return (
    <DashboardSection title="Historias desarrolladas">
      <PbiListSkeleton variant="compact" />
    </DashboardSection>
  );
}
