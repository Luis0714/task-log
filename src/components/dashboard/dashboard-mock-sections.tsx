"use client";

import { DashboardDemoBanner } from "@/components/dashboard/dashboard-demo-banner";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintHuCountBadge } from "@/components/dashboard/metrics/sprint-hu-count-badge";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import { SprintHoursSection } from "@/components/dashboard/sections/sprint-hours-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import { MOCK_DASHBOARD_METRICS } from "@/lib/dashboard/mock-data";
import {
  MOCK_DELIVERY_METRICS,
  MOCK_SPRINT_DAY_KEY,
  MOCK_WORKFLOW_METRICS,
} from "@/lib/dashboard/mock-section-metrics";

export function DashboardMockSections() {
  return (
    <div className="flex flex-col gap-6 opacity-95">
      <DashboardDemoBanner />
      <DashboardSection
        title="Entrega del sprint"
        action={
          <SprintHuCountBadge
            count={MOCK_DELIVERY_METRICS.sprintStatusOverview.userStories.assigned}
          />
        }
      >
        <SprintDeliverySection metrics={MOCK_DELIVERY_METRICS} />
      </DashboardSection>

      <DashboardSection title="Tiempo y ritmo">
        <SprintHoursSection
          metrics={MOCK_DASHBOARD_METRICS}
          hoursDayLabel="Horas del día"
          selectedDayKey={MOCK_SPRINT_DAY_KEY}
        />
      </DashboardSection>

      <DashboardSection title="Trabajo por estado">
        <SprintWorkflowSection metrics={MOCK_WORKFLOW_METRICS} />
      </DashboardSection>
    </div>
  );
}
