import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardDailySectionSkeleton() {
  return (
    <DashboardSection
      title="Resumen del daily"
      description="Texto breve para compartir en tu reunión diaria."
    >
      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </DashboardSection>
  );
}
