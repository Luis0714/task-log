import { Skeleton } from "@/components/ui/skeleton";
import { NeosIaWelcomeSkeleton } from "@/components/skeletons/neos-ia-welcome-skeleton";
import { cn } from "@/lib/utils";

export type NeosIaPageSkeletonProps = {
  className?: string;
};

/**
 * Page-level skeleton para el empty-state inicial de `/neos-ia`. Refleja
 * 1:1 el layout de {@link import("@/components/neos-ia/neos-ia-view").NeosIaView}
 * cuando todavía no hay mensajes:
 *
 * - Header sticky 64px con `PlanSelector` + botón "Nueva conversación"
 *   a la izquierda y `ProviderSelector` a la derecha.
 * - Zona central scrolleable con la columna del empty-state:
 *   welcome (`<h1>`) + composer (`CopilotInput`) + quick action pills.
 *
 * El footer sticky **no** se incluye aquí: en el empty-state real el
 * composer vive dentro del layout padre, no en un footer separado
 * (el footer solo aparece cuando ya hay mensajes en la conversación).
 */
export function NeosIaPageSkeleton({
  className,
}: Readonly<NeosIaPageSkeletonProps>) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <header className="bg-background/95 sticky top-0 z-20 h-16 shrink-0 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <div
              aria-hidden
              className="inline-flex items-center gap-1"
            >
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="size-3.5 rounded-sm" />
            </div>
            <div
              aria-hidden
              className="flex items-center gap-1.5"
            >
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="hidden h-5 w-28 rounded-md sm:inline-block" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </header>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-6">
          <NeosIaWelcomeSkeleton className="rounded-md" />

          <div
            aria-hidden
            className="bg-card flex w-full items-center justify-between gap-2 rounded-[28px] px-4 py-3 shadow-xs/10"
          >
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="size-9 rounded-full" />
          </div>

          <div
            role="list"
            aria-hidden
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <PillSkeleton iconClass="size-3.5" labelWidthClass="w-28 sm:w-36" />
            <PillSkeleton iconClass="size-3.5" labelWidthClass="w-20 sm:w-24" />
            <PillSkeleton iconClass="size-3.5" labelWidthClass="w-32 sm:w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

type PillSkeletonProps = {
  iconClass: string;
  labelWidthClass: string;
};

function PillSkeleton({
  iconClass,
  labelWidthClass,
}: Readonly<PillSkeletonProps>) {
  return (
    <div
      role="listitem"
      className="border-border/60 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5"
    >
      <Skeleton className={cn(iconClass, "rounded-full")} />
      <Skeleton className={cn("h-3.5 rounded-md", labelWidthClass)} />
    </div>
  );
}