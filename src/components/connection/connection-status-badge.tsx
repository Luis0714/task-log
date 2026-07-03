import { WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConnectionStatusBadgeProps = Readonly<{
  isConnected: boolean;
  /**
   * Clases extra para ajustar el tamaño/contenedor (p.ej. `w-full` cuando
   * el badge se renderiza dentro de un grid que requiere ancho uniforme).
   * La base del `Badge` ya aporta `h-5`, `rounded-4xl`, `px-2 py-0.5`,
   * `gap-1.5` y `text-[11px]`, por lo que este prop solo debe usarse para
   * overrides contextuales.
   */
  className?: string;
}>;

export function ConnectionStatusBadge({ isConnected, className }: ConnectionStatusBadgeProps) {
  if (isConnected) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 inline-flex shrink-0 items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold",
          className,
        )}
      >
        <span className="relative flex size-2 items-center justify-center" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </span>Conectado
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border bg-muted/30 text-muted-foreground inline-flex shrink-0 items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      <span className="bg-muted-foreground/70 size-1.5 rounded-full" aria-hidden />
      <WifiOff className="size-3" aria-hidden />
      Sin conectar
    </Badge>
  );
}
