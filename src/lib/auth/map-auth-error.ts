export function mapAuthErrorFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  if (searchParams.get("azdo") === "connected") {
    return null;
  }

  const error = searchParams.get("azdo_error");
  if (error !== "auth") return null;

  const detail = searchParams.get("detail") ?? "";

  if (detail === "no_refresh_token_admin_consent") {
    return "Tu empresa debe autorizar esta aplicación. Pide ayuda al equipo de sistemas.";
  }
  if (detail === "oauth_disabled") {
    return "El inicio con cuenta Microsoft no está disponible en este entorno.";
  }
  if (detail === "invalid_state" || detail === "missing_code") {
    return "La conexión se interrumpió. Vuelve a intentarlo.";
  }
  if (detail) {
    return "No pudimos conectarte. Prueba otra vez o usa el código de acceso.";
  }

  return "No pudimos conectarte. Prueba otra vez.";
}
