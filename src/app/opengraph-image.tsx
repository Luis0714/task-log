import { ImageResponse } from "next/og";

import { IsotipoBadgeOgSvg } from "@/lib/brand/isotipo-badge-og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f1f3",
        }}
      >
        <IsotipoBadgeOgSvg size={280} />
      </div>
    ),
    { ...size },
  );
}
