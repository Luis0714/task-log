import { USER_MESSAGES } from "@/lib/errors/user-messages";

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
  if (detail === "oauth_disabled" || detail === "microsoft_unavailable") {
    return USER_MESSAGES.microsoftUnavailable;
  }
  if (detail === "persistence_unavailable") {
    return USER_MESSAGES.persistenceUnavailable;
  }
  if (detail === "session_unavailable") {
    return USER_MESSAGES.sessionUnavailable;
  }
  if (detail === "incomplete_connection") {
    return "No pudimos vincular tu organización y proyecto en Azure DevOps. Vuelve a intentarlo o pide ayuda a tu administrador.";
  }
  if (detail === "invalid_state" || detail === "missing_code") {
    return "La conexión se interrumpió. Vuelve a intentarlo.";
  }

  return "No pudimos conectarte. Prueba otra vez desde Iniciar sesión.";
}
