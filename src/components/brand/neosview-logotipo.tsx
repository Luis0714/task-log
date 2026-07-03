import {
  NEOSVIEW_LOGOTIPO_NEOS_PATH,
  NEOSVIEW_LOGOTIPO_VIEWBOX,
  NEOSVIEW_LOGOTIPO_VIEW_PATH,
} from "@/components/brand/brand-paths";
import { NeosViewLogo, type NeosViewLogoProps } from "@/components/brand/neosview-logo";
import { cn } from "@/lib/utils";

export type NeosViewLogotipoProps = Omit<NeosViewLogoProps, "viewBox" | "children"> & {
  neosClassName?: string;
  viewClassName?: string;
};

/** Solo el wordmark tipográfico (neos + view). */
export function NeosViewLogotipo({
  className,
  neosClassName,
  viewClassName,
  title = "NeosView",
}: NeosViewLogotipoProps) {
  return (
    <NeosViewLogo viewBox={NEOSVIEW_LOGOTIPO_VIEWBOX} className={className} title={title}>
      <path
        d={NEOSVIEW_LOGOTIPO_NEOS_PATH}
        className={cn("fill-brand-mark", neosClassName)}
      />
      <path
        d={NEOSVIEW_LOGOTIPO_VIEW_PATH}
        className={cn("fill-current", viewClassName)}
      />
    </NeosViewLogo>
  );
}
