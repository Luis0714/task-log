import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";

export type SprintStatsDashboardViewProps = {
  isPastSprint?: boolean;
};

export function SprintStatsDashboardView({
  isPastSprint = false,
}: SprintStatsDashboardViewProps) {
  return (
    <DashboardSection
      title="Estadísticas del sprint"
      description={
        isPastSprint
          ? "Finaliza el sprint para guardar métricas históricas fiables."
          : "Métricas de entrega, horas y trabajo por estado."
      }
    >
      <p className="text-muted-foreground text-sm">
        {isPastSprint
          ? "Este sprint aún no tiene retrospectiva guardada. Usa «Finalizar sprint» para congelar el resultado del cierre."
          : "El dashboard operativo en vivo se mostrará aquí. Cuando cierres el sprint, esta vista pasará a la retrospectiva congelada."}
      </p>
    </DashboardSection>
  );
}
