import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";

/** Navegación inicial a `/`: solo shell; las secciones stream por separado. */
export function DashboardPageSkeleton({ className }: { className?: string }) {
  return <DashboardShellSkeleton className={className} />;
}
