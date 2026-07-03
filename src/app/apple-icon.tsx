import { ImageResponse } from "next/og";

import { IsotipoBadgeOgSvg } from "@/lib/brand/isotipo-badge-og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <IsotipoBadgeOgSvg size={128} />
      </div>
    ),
    { ...size },
  );
}
