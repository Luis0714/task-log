import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";

export function DashboardHoursSectionSkeleton() {
  return (
    <DashboardSection title="Tiempo y ritmo">
      <SectionBlockSkeleton content="chart-hours" showHeader={false} />
    </DashboardSection>
  );
}
