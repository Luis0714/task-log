import { SITE_NAME } from "@/lib/seo/site";

/** Editor / responsable mostrado en políticas (ajusta con NEXT_PUBLIC_LEGAL_PUBLISHER). */
export const LEGAL_PUBLISHER =
  process.env.NEXT_PUBLIC_LEGAL_PUBLISHER?.trim() || "Estremor";

/** Correo de contacto para privacidad y soporte legal. */
export const LEGAL_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || "privacidad@estremor.com";

export const LEGAL_APP_NAME = SITE_NAME;
