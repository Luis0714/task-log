import type { MetadataRoute } from "next";

import { isIndexingAllowed, PUBLIC_APP_PATHS, resolveSiteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();
  if (!isIndexingAllowed() || !siteUrl) return [];

  const lastModified = new Date();

  return PUBLIC_APP_PATHS.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
