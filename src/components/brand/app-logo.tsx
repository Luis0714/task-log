import Link from "next/link";

import { NeosViewIsotipo } from "@/components/brand/neosview-isotipo";
import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { NeosViewMarca } from "@/components/brand/neosview-marca";
import { cn } from "@/lib/utils";

const logoToneClassNames = {
  sidebar: "text-sidebar-foreground focus-visible:ring-sidebar-ring",
  surface: "text-foreground focus-visible:ring-ring",
} as const;

export type AppLogoProps = {
  href?: string;
  /** Solo isotipo — sidebar colapsado o barra móvil compacta. */
  compact?: boolean;
  /** Isotipo en pastilla con fondo de marca e icono blanco (p. ej. header móvil). */
  isotipoBadge?: boolean;
  /** Sidebar (panel lateral) o surface (header móvil sobre fondo principal). */
  tone?: keyof typeof logoToneClassNames;
  className?: string;
};

export function AppLogo({
  href = "/",
  compact = false,
  isotipoBadge = false,
  tone = "sidebar",
  className,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-w-0 max-w-full items-center rounded-lg outline-none transition-opacity",
        "focus-visible:ring-2",
        logoToneClassNames[tone],
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
