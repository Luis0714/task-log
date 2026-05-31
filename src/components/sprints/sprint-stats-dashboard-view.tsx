import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";

export function SprintStatsDashboardView() {
  return (
    <DashboardSection
      title="Estadísticas del sprint"
      description="Métricas de entrega, horas y trabajo por estado."
    >
      <p className="text-muted-foreground text-sm">
        El dashboard de estadísticas se mostrará aquí para el sprint seleccionado.
      </p>
    </DashboardSection>
  );
}
