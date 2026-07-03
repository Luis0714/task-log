import { NeosViewIsotipo } from "@/components/brand/neosview-isotipo";
import { cn } from "@/lib/utils";

export type NeosViewIsotipoBadgeProps = {
  className?: string;
};

/**
 * Isotipo sobre fondo de marca (morado + símbolo blanco).
 * Mismo aspecto en sidebar, header móvil y favicon.
 */
export function NeosViewIsotipoBadge({ className }: NeosViewIsotipoBadgeProps) {
  return (
    <span
      className={cn(
        "bg-brand-mark flex size-8 shrink-0 items-center justify-center rounded-md p-1",
        className,
      )}
    >
      <NeosViewIsotipo className="size-6" markClassName="fill-white" />
    </span>
  );
}
