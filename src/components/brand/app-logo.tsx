import Link from "next/link";

import { NeosViewIsotipo } from "@/components/brand/neosview-isotipo";
import { NeosViewLogotipo } from "@/components/brand/neosview-logotipo";
import { cn } from "@/lib/utils";

export type AppLogoProps = {
  href?: string;
  /** Solo isotipo — sidebar colapsado o barra móvil compacta. */
  compact?: boolean;
  className?: string;
};

export function AppLogo({
  href = "/",
  compact = false,
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
        <NeosViewIsotipo className="size-8" />
      ) : (
        <NeosViewLogotipo className="block h-7 w-auto max-w-full sm:h-8" />
      )}
    </Link>
  );
}
