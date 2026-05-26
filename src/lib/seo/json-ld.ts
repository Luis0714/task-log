import {
  resolveSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo/site";

export function buildSoftwareApplicationJsonLd(): Record<string, unknown> {
  const siteUrl = resolveSiteUrl()?.origin;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    inLanguage: "es",
    ...(siteUrl ? { url: siteUrl } : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      SITE_TAGLINE,
      "Integración con Azure DevOps",
      "Panel de sprint y métricas Agile",
      "Copiloto con inteligencia artificial",
      "Registro de tiempo y gestión de elementos de trabajo",
    ],
  };
}
