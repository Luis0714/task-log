import Link from "next/link";

import { NeosViewIsotipo } from "@/components/brand/neosview-isotipo";
import { NeosViewLogotipo } from "@/components/brand/neosview-logotipo";
import { cn } from "@/lib/utils";

export type AppLogoProps = {
  href?: string;
  /** Solo isotipo — sidebar colapsado o barra móvil compacta. */
  compact?: boolean;
  /** Subtítulo bajo el logotipo. */
  showTagline?: boolean;
  className?: string;
};

export function AppLogo({
  href = "/",
  compact = false,
  showTagline = true,
  className,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-w-0 items-center gap-2.5 rounded-lg text-sidebar-foreground outline-none transition-opacity",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        !compact && showTagline && "flex-col items-start gap-1",
        className,
      )}
      aria-label="NeosView — inicio"
    >
      {compact ? (
        <NeosViewIsotipo className="size-9" />
      ) : (
        <NeosViewLogotipo className="h-7 w-auto sm:h-8" />
      )}

      {!compact && showTagline && (
        <span className="text-sidebar-foreground/55 hidden truncate text-[0.65rem] font-medium tracking-wide uppercase sm:block">
          Azure DevOps
        </span>
      )}
    </Link>
  );
}
