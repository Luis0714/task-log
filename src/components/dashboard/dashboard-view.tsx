"use client";

import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintOverviewGrid } from "@/components/dashboard/metrics/sprint-overview-grid";
import { PbiList } from "@/components/dashboard/work-items/pbi-list";
import {
  MOCK_ASSIGNED_PBIS,
  MOCK_DASHBOARD_METRICS,
  MOCK_IN_PROGRESS_PBIS,
  MOCK_UPCOMING_PBIS,
} from "@/lib/dashboard/mock-data";
import type { DashboardHeaderData, DashboardMetrics, DashboardWorkItem } from "@/lib/dashboard/types";

export type DashboardViewProps = {
  header: DashboardHeaderData;
  metrics?: DashboardMetrics;
  inProgress?: DashboardWorkItem[];
  upcoming?: DashboardWorkItem[];
  assigned?: DashboardWorkItem[];
  loading?: boolean;
};

export function DashboardView({
  header,
  metrics = MOCK_DASHBOARD_METRICS,
  inProgress = MOCK_IN_PROGRESS_PBIS,
  upcoming = MOCK_UPCOMING_PBIS,
  assigned = MOCK_ASSIGNED_PBIS,
  loading = false,
}: DashboardViewProps) {
  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <DashboardHeader data={header} />

      <DashboardSection
        title="Sprint Overview"
        description="Tu progreso de hoy y del sprint actual."
      >
        <SprintOverviewGrid metrics={metrics} loading={loading} />
      </DashboardSection>

      <DashboardSection
        title="PBIs en progreso"
        description="Lo que estás trabajando ahora mismo."
      >
        <PbiList
          items={inProgress}
          variant="featured"
          emptyMessage="No tienes PBIs en progreso."
        />
      </DashboardSection>

      <DashboardSection
        title="Próximas PBIs"
        description="Qué deberías hacer después, ordenadas por prioridad."
      >
        <PbiList
          items={upcoming}
          variant="compact"
          emptyMessage="No hay PBIs pendientes por ahora."
        />
      </DashboardSection>

      <DashboardSection
        title="PBIs asignadas al sprint"
        description="Todas tus historias del sprint actual."
      >
        <PbiList
          items={assigned}
          variant="compact"
          showHours
          emptyMessage="No tienes PBIs asignadas en este sprint."
        />
      </DashboardSection>
    </div>
  );
}
