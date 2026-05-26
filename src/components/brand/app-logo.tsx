import Link from "next/link";

import { NeosViewIsotipo } from "@/components/brand/neosview-isotipo";
import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { NeosViewMarca } from "@/components/brand/neosview-marca";
import { cn } from "@/lib/utils";

export type AppLogoProps = {
  href?: string;
  /** Solo isotipo — sidebar colapsado o barra móvil compacta. */
  compact?: boolean;
  /** Isotipo en pastilla con fondo de marca e icono blanco (p. ej. header móvil). */
  isotipoBadge?: boolean;
  className?: string;
};

export function AppLogo({
  href = "/",
  compact = false,
  isotipoBadge = false,
  className,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-w-0 max-w-full items-center rounded-lg text-sidebar-foreground outline-none transition-opacity",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      aria-label="NeosView — inicio"
    >
      {compact ? (
        isotipoBadge ? (
          <NeosViewIsotipoBadge />
        ) : (
          <NeosViewIsotipo className="size-8" />
        )
      ) : (
        <NeosViewMarca className="max-w-full" />
      )}
    </Link>
  );
}
