import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Cabecera + barra de contexto del dashboard (sin secciones de métricas). */
export function DashboardShellSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full max-w-3xl rounded-lg" />
    </div>
  );
}
