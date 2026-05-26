import {
  NEOSVIEW_ISOTIPO_PATH,
  NEOSVIEW_ISOTIPO_VIEWBOX,
} from "@/components/brand/brand-paths";
import { NeosViewLogo, type NeosViewLogoProps } from "@/components/brand/neosview-logo";
import { cn } from "@/lib/utils";

export type NeosViewIsotipoProps = Omit<NeosViewLogoProps, "viewBox" | "children"> & {
  /** Color del símbolo; por defecto usa el morado de marca. */
  markClassName?: string;
};

export function NeosViewIsotipo({
  className,
  markClassName,
  title,
}: NeosViewIsotipoProps) {
  return (
    <NeosViewLogo
      viewBox={NEOSVIEW_ISOTIPO_VIEWBOX}
      className={className}
      title={title}
    >
      <path
        d={NEOSVIEW_ISOTIPO_PATH}
        className={cn("fill-(--brand-mark)", markClassName)}
      />
    </NeosViewLogo>
  );
}
