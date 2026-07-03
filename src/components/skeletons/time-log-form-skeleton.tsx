import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton que refleja el layout real del formulario de registro de tiempo
 * en sus dos modos (Individual y Múltiple):
 *
 *  1. Bloque "Contexto y filtros" colapsable.
 *  2. Modo Individual: tarjeta con los campos del formulario.
 *  3. Modo Múltiple: jerarquía Historia → Tareas con dos grupos que
 *     muestran un par de tareas cada uno, más el botón primario inferior.
 *
 * El parámetro `view` permite ajustar el contenido según la vista
 * seleccionada (cuando el shell lo sepa con anticipación).
 */
export type TimeLogFormSkeletonProps = Readonly<{
  className?: string;
  view?: "individual" | "multiple";
}>;

function GroupSkeleton({ taskCount = 2 }: { readonly taskCount?: number }) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-card p-3">
      {/* Header del grupo (HU): chevron + # + título + chip */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-3.5 w-4" />
        <Skeleton className="h-3.5 flex-1 max-w-[55%]" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      {/* Selector de PBI abierto */}
      <div className="space-y-1.5 border-t border-border/40 pt-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      {/* Tareas anidadas */}
      <div className="space-y-3">
        {Array.from({ length: taskCount }).map((_, idx) => (
          <TaskSkeleton key={idx} />
        ))}
      </div>
      {/* Botón Agregar Tarea */}
      <div className="flex justify-end border-t border-border/40 pt-3">
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3 rounded-md border border-border/40 bg-muted/20 p-3">
      {/* Header de la tarea: chevron + # + título */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-3.5 w-4" />
        <Skeleton className="h-3.5 flex-1 max-w-[40%]" />
      </div>
      {/* Plantillas */}
      <div className="space-y-1.5 border-t border-border/40 pt-3">
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
      {/* Título + Horas + Actividad */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      {/* Descripción */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      {/* Fecha y hora */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ContextSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function IndividualFormSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
      {/* Plantillas */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
      {/* Historia */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      {/* Título */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      {/* Horas + Actividad */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      {/* Descripción */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      {/* Fecha y hora */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      {/* Botón submit full-width */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

function MultipleFormSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
      {/* Alerta informativa */}
      <Skeleton className="h-12 w-full rounded-md" />
      {/* Dos grupos de HU con tareas */}
      <GroupSkeleton taskCount={2} />
      <GroupSkeleton taskCount={1} />
      {/* Footer: botón Agregar Historia + totales */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Skeleton className="h-9 w-44 rounded-md" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      {/* Botón submit full-width */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

export function TimeLogFormSkeleton({
  className,
  view,
}: TimeLogFormSkeletonProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      <ContextSkeleton />
      {view === "multiple" ? (
        <MultipleFormSkeleton />
      ) : (
        // Default: Individual. Coincide con `DEFAULT_TIME_LOG_VIEW` y con
        // el modo al que vuelve la pantalla cuando el usuario no pasa
        // `?modo=` por URL.
        <IndividualFormSkeleton />
      )}
    </div>
  );
}
