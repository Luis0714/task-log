export type AzdoAuthMethod = "pat" | "oauth";

const VALID_METHODS: AzdoAuthMethod[] = ["pat", "oauth"];

export function getAzdoAuthMethod(): AzdoAuthMethod {
  const raw = process.env.AZDO_AUTH_METHOD?.trim().toLowerCase();
  if (raw && VALID_METHODS.includes(raw as AzdoAuthMethod)) {
    return raw as AzdoAuthMethod;
  }
  return "pat";
}

export function isPatAuthMethod(): boolean {
  return getAzdoAuthMethod() === "pat";
}

export function isOAuthAuthMethod(): boolean {
  return getAzdoAuthMethod() === "oauth";
}
