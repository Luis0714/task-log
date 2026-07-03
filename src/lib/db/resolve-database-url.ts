import "server-only";

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  /** Integración Neon en Vercel (pooled). */
  "POSTGRES_URL",
] as const;

/** URL pooled para la app en runtime. */
export function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getDatabaseUrlSource():
  | (typeof DATABASE_URL_ENV_KEYS)[number]
  | null {
  for (const key of DATABASE_URL_ENV_KEYS) {
    if (process.env[key]?.trim()) return key;
  }
  return null;
}
