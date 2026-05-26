import {
  NEOSVIEW_LOGOTIPO_MARK_PATH,
  NEOSVIEW_LOGOTIPO_VIEWBOX,
  NEOSVIEW_LOGOTIPO_WORDMARK_PATH,
} from "@/components/brand/brand-paths";
import { NeosViewLogo, type NeosViewLogoProps } from "@/components/brand/neosview-logo";
import { cn } from "@/lib/utils";

export type NeosViewLogotipoProps = Omit<NeosViewLogoProps, "viewBox" | "children"> & {
  markClassName?: string;
  wordmarkClassName?: string;
};

export function NeosViewLogotipo({
  className,
  markClassName,
  wordmarkClassName,
  title = "NeosView",
}: NeosViewLogotipoProps) {
  return (
    <NeosViewLogo
      viewBox={NEOSVIEW_LOGOTIPO_VIEWBOX}
      className={className}
      title={title}
    >
      <path
        d={NEOSVIEW_LOGOTIPO_MARK_PATH}
        className={cn("fill-[var(--brand-mark)]", markClassName)}
      />
      <path
        d={NEOSVIEW_LOGOTIPO_WORDMARK_PATH}
        className={cn("fill-current", wordmarkClassName)}
      />
    </NeosViewLogo>
  );
}
