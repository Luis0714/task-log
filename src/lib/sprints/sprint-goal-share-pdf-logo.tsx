import {
  NEOSVIEW_ISOTIPO_PATH,
  NEOSVIEW_ISOTIPO_VIEWBOX,
} from "@/components/brand/brand-paths";
import { BRAND_MARK_HEX } from "@/lib/brand/isotipo-badge-og";
import { G, Path, Rect, Svg, View } from "@react-pdf/renderer";

const BADGE_VIEWBOX = "0 0 32 32";
const BADGE_RADIUS = 6;
const BADGE_PADDING = 4;
const BADGE_INNER = 32 - BADGE_PADDING * 2;

const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = NEOSVIEW_ISOTIPO_VIEWBOX.split(" ").map(Number);
const innerScale = Math.min(BADGE_INNER / viewBoxWidth, BADGE_INNER / viewBoxHeight);
const scaledWidth = viewBoxWidth * innerScale;
const scaledHeight = viewBoxHeight * innerScale;
const innerOffsetX = BADGE_PADDING + (BADGE_INNER - scaledWidth) / 2;
const innerOffsetY = BADGE_PADDING + (BADGE_INNER - scaledHeight) / 2;
const isotipoTransform = `translate(${innerOffsetX}, ${innerOffsetY}) scale(${innerScale}) translate(${-viewBoxX}, ${-viewBoxY})`;

export type SprintGoalSharePdfLogoProps = {
  size?: number;
};

export function SprintGoalSharePdfLogo({ size = 42 }: SprintGoalSharePdfLogoProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={BADGE_VIEWBOX}>
        <Rect width="32" height="32" rx={BADGE_RADIUS} fill={BRAND_MARK_HEX} />
        <G transform={isotipoTransform}>
          <Path fill="#ffffff" d={NEOSVIEW_ISOTIPO_PATH} />
        </G>
      </Svg>
    </View>
  );
}
