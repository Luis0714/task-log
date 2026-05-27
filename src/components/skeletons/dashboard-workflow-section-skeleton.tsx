import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";

export function DashboardWorkflowSectionSkeleton() {
  return (
    <DashboardSection title="Trabajo por estado">
      <SectionBlockSkeleton content="chart-workflow" showHeader={false} />
    </DashboardSection>
  );
}
