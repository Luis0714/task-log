import { Cloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getAuthMethodLabel,
  type AdoConnectionDisplay,
} from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type AdoConnectionBadgeProps = AdoConnectionDisplay & {
  className?: string;
};

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border text-muted-foreground">
      <span className="bg-muted-foreground size-1.5 rounded-full" aria-hidden />
      Sin conectar
    </Badge>
  );
}

export function AdoConnectionBadge({
  authMethod,
  isConnected,
  organization,
  project,
  className,
}: AdoConnectionBadgeProps) {
  const hasTarget = Boolean(organization?.trim() && project?.trim());

  return (
    <section
      aria-label="Conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex gap-3 rounded-lg border p-3",
        className,
      )}
    >
      <div
        className="bg-sidebar-primary/15 text-sidebar-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
        aria-hidden
      >
        <Cloud className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sidebar-foreground/55 text-[0.65rem] font-medium tracking-wide uppercase">
              Azure DevOps
            </p>
            {hasTarget ? (
              <p className="text-sidebar-foreground truncate text-sm font-medium">
                {organization}
                <span className="text-sidebar-foreground/45 mx-1 font-normal">/</span>
                {project}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Org y proyecto no configurados</p>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs">{getAuthMethodLabel(authMethod)}</p>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>
    </section>
  );
}
