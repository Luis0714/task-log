import { NextResponse } from "next/server";

/** Evita que el navegador reutilice un redirect OAuth en caché al reintentar. */
export function oauthRedirect(url: string | URL): NextResponse {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
