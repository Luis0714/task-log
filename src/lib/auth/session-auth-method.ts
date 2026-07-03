export type SessionAuthMethod = "pat" | "oauth";

export const SESSION_AUTH_METHODS: SessionAuthMethod[] = ["pat", "oauth"];

export function isSessionAuthMethod(value: string): value is SessionAuthMethod {
  return SESSION_AUTH_METHODS.includes(value as SessionAuthMethod);
}
