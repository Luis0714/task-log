export type AzdoAuthMethod = "pat" | "oauth" | "both";

export type ConnectAuthOptions = {
  /** Sesión cifrada disponible (IRON_SESSION_PASSWORD). */
  sessionReady: boolean;
  /** Base de datos y cifrado listos para cuentas guardadas. */
  persistenceReady: boolean;
  /** Microsoft Entra configurado y persistencia lista. */
  oauthReady: boolean;
  /** Registro/login con código de acceso (cuenta guardada en BD). */
  patReady: boolean;
};

const VALID_METHODS: AzdoAuthMethod[] = ["pat", "oauth", "both"];

export function getAzdoAuthMethod(): AzdoAuthMethod {
  const raw = process.env.AZDO_AUTH_METHOD?.trim().toLowerCase();
  if (raw && VALID_METHODS.includes(raw as AzdoAuthMethod)) {
    return raw as AzdoAuthMethod;
  }
  return "pat";
}

export function isPatAuthMethod(): boolean {
  const method = getAzdoAuthMethod();
  return method === "pat" || method === "both";
}

export function isOAuthAuthMethod(): boolean {
  const method = getAzdoAuthMethod();
  return method === "oauth" || method === "both";
}

export function isBothAuthMethod(): boolean {
  return getAzdoAuthMethod() === "both";
}

/** La app ofrece pantalla de inicio de sesión al usuario (no solo PAT en servidor). */
export function isSignInUiOffered(): boolean {
  const deploy = getAzdoAuthMethod();
  return deploy === "both" || deploy === "oauth" || deploy === "pat";
}

export function hasConnectMethod(options: ConnectAuthOptions): boolean {
  return options.persistenceReady && (options.oauthReady || options.patReady);
}
