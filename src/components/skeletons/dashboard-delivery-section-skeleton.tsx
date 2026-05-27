import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { SectionTitleBadgeSkeleton } from "@/components/skeletons/section-title-badge-skeleton";

export function DashboardDeliverySectionSkeleton() {
  return (
    <DashboardSection title="Entrega del sprint" action={<SectionTitleBadgeSkeleton />}>
      <SectionBlockSkeleton content="chart-delivery" showHeader={false} />
    </DashboardSection>
  );
}
