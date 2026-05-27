import type { Metadata } from "next";

import type { PageSeoEntry } from "@/lib/seo/pages";
import { PAGE_SEO } from "@/lib/seo/pages";
import {
  APPLE_TOUCH_ICON_PATH,
  DEFAULT_ICON_PATH,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_WIDTH,
  isIndexingAllowed,
  resolveSiteUrl,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo/site";

function buildRobotsDirective(): Metadata["robots"] {
  if (isIndexingAllowed()) {
    return {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    };
  }

  return {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  };
}

function buildOpenGraph(
  title: string,
  description: string,
  path?: string,
): NonNullable<Metadata["openGraph"]> {
  const siteUrl = resolveSiteUrl();
  const url = siteUrl && path ? new URL(path, siteUrl).toString() : undefined;

  return {
    type: "website",
    locale: "es_ES",
    siteName: SITE_NAME,
    title: `${title} | ${SITE_NAME}`,
    description,
    ...(url ? { url } : {}),
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  };
}

function buildTwitter(
  title: string,
  description: string,
): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [DEFAULT_OG_IMAGE_PATH],
  };
}

export function buildRootMetadata(): Metadata {
  const siteUrl = resolveSiteUrl();

  return {
    metadataBase: siteUrl,
    applicationName: SITE_NAME,
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [...SITE_KEYWORDS],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    robots: buildRobotsDirective(),
    alternates: siteUrl ? { canonical: "/" } : undefined,
    openGraph: buildOpenGraph(SITE_NAME, SITE_DESCRIPTION, "/"),
    twitter: buildTwitter(SITE_NAME, SITE_DESCRIPTION),
    icons: {
      icon: [{ url: DEFAULT_ICON_PATH, type: "image/svg+xml" }],
      apple: [
        { url: APPLE_TOUCH_ICON_PATH, sizes: "180x180", type: "image/png" },
      ],
    },
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export function buildPageMetadata(entry: PageSeoEntry): Metadata {
  return {
    title: entry.title,
    description: entry.description,
    alternates: entry.path
      ? { canonical: entry.path === "/" ? "/" : entry.path }
      : undefined,
    openGraph: buildOpenGraph(entry.title, entry.description, entry.path),
    twitter: buildTwitter(entry.title, entry.description),
  };
}

export function buildShellLayoutMetadata(): Metadata {
  return {
    title: {
      template: `%s | ${SITE_NAME}`,
      default: PAGE_SEO.dashboard.title,
    },
  };
}
