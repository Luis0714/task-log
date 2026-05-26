import type { MetadataRoute } from "next";

import {
  APPLE_TOUCH_ICON_PATH,
  DEFAULT_ICON_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f1f1f3",
    theme_color: "#1741b1",
    lang: "es",
    icons: [
      {
        src: DEFAULT_ICON_PATH,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: APPLE_TOUCH_ICON_PATH,
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
