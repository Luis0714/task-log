/** Rutas públicas de documentos legales (consentimiento Microsoft Entra / marca). */
export const LEGAL_PATHS = {
  privacy: "/privacy",
  terms: "/terms",
} as const;

export const LEGAL_PATH_LIST = [LEGAL_PATHS.privacy, LEGAL_PATHS.terms] as const;
