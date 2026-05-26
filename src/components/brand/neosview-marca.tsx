import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { NeosViewLogotipo } from "@/components/brand/neosview-logotipo";
import { cn } from "@/lib/utils";

export type NeosViewMarcaProps = {
  className?: string;
  isotipoBadgeClassName?: string;
  logotipoClassName?: string;
  title?: string;
};

/** Marca corporativa: isotipo + logotipo tipográfico. */
export function NeosViewMarca({
  className,
  isotipoBadgeClassName,
  logotipoClassName,
  title = "NeosView",
}: NeosViewMarcaProps) {
  return (
    <span
      className={cn("inline-flex max-w-full min-w-0 items-center gap-2", className)}
      role="img"
      aria-label={title}
    >
      <NeosViewIsotipoBadge className={isotipoBadgeClassName} />
      <NeosViewLogotipo
        className={cn("block h-5 w-auto max-w-full sm:h-5.5", logotipoClassName)}
        title={undefined}
      />
    </span>
  );
}
