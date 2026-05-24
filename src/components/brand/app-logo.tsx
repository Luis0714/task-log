import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

export type AppLogoProps = {
  href?: string;
  /** Solo isotipo — útil en sidebar colapsado o barra móvil compacta. */
  compact?: boolean;
  /** Subtítulo bajo el nombre; oculto en pantallas muy pequeñas si `compact`. */
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
        "group inline-flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-opacity",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      aria-label="TaskPilot — inicio"
    >
      <LogoMark className={cn(compact ? "size-9" : "size-8 sm:size-9")} />

      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-heading text-base font-semibold tracking-tight text-sidebar-foreground sm:text-[1.05rem]">
            TaskPilot
          </span>
          {showTagline && (
            <span className="text-sidebar-foreground/55 mt-1 hidden truncate text-[0.65rem] font-medium tracking-wide uppercase sm:block">
              Azure DevOps
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
