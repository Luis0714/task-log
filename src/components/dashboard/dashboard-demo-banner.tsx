import { Info } from "lucide-react";

export function DashboardDemoBanner() {
  return (
    <div
      className="border-amber-500/25 bg-amber-500/8 flex items-start gap-3 rounded-lg border px-4 py-3"
      role="status"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Vista de demostración
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Los datos que ves son de ejemplo. Inicia sesión para cargar tu sprint
          y tu trabajo real desde Azure DevOps.
        </p>
      </div>
    </div>
  );
}
