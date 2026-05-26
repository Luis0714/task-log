export const SITE_NAME = "NeosView";

export const SITE_TAGLINE =
  "Plataforma Agile con IA para Azure DevOps";

export const SITE_DESCRIPTION =
  "NeosView es una plataforma Agile moderna impulsada por inteligencia artificial que centraliza la visibilidad, gestión y operación del trabajo en herramientas como Azure DevOps, ayudando a los equipos a trabajar de forma más clara, rápida e inteligente.";

export const SITE_KEYWORDS = [
  "NeosView",
  "Azure DevOps",
  "plataforma Agile",
  "gestión de trabajo",
  "inteligencia artificial",
  "copiloto IA",
  "sprint",
  "work items",
  "Scrum",
  "registro de tiempo",
  "visibilidad de equipo",
  "devops",
] as const;

/** Rutas públicas de la app (para sitemap cuando la indexación está habilitada). */
export const PUBLIC_APP_PATHS = [
  "/",
  "/copilot",
  "/time-log",
  "/work-items",
  "/tasks",
  "/bugs",
  "/settings",
] as const;

export const DEFAULT_OG_IMAGE_PATH = "/images/logotipo.png";
export const DEFAULT_ICON_PATH = "/svgs/isotipo.svg";
export const APPLE_TOUCH_ICON_PATH = "/images/isotipo-colors.png";

export function resolveSiteUrl(): URL | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.AUTH_BASE_URL?.trim();
  if (!raw) return undefined;

  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export function isIndexingAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
}
