import {
  NEOSVIEW_ISOTIPO_PATH,
  NEOSVIEW_ISOTIPO_VIEWBOX,
} from "@/components/brand/brand-paths";

/** Morado de marca (tema claro) — mismo valor que `--brand-mark` en globals.css. */
export const BRAND_MARK_HEX = "#8b5cf6";

const BADGE_VIEWBOX = "0 0 32 32";
const BADGE_RADIUS = 6;
const BADGE_PADDING = 4;
const BADGE_INNER = 32 - BADGE_PADDING * 2;

type IsotipoBadgeOgSvgProps = {
  size: number;
};

/** Isotipo en pastilla morada — equivalente visual a `NeosViewIsotipoBadge`. */
export function IsotipoBadgeOgSvg({ size }: IsotipoBadgeOgSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={BADGE_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="32"
        height="32"
        rx={BADGE_RADIUS}
        fill={BRAND_MARK_HEX}
      />
      <svg
        x={BADGE_PADDING}
        y={BADGE_PADDING}
        width={BADGE_INNER}
        height={BADGE_INNER}
        viewBox={NEOSVIEW_ISOTIPO_VIEWBOX}
      >
        <path fill="#ffffff" d={NEOSVIEW_ISOTIPO_PATH} />
      </svg>
    </svg>
  );
}
