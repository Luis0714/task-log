import "server-only";

import { USER_MESSAGES } from "@/lib/errors/user-messages";

const TECHNICAL_PATTERNS: Array<{ test: RegExp; message: string }> = [
  { test: /openai|api key|401|403/i, message: USER_MESSAGES.copilotInterpret },
  { test: /database_url|encryption_key|iron_session/i, message: USER_MESSAGES.persistenceUnavailable },
  { test: /enoent|econnrefused|fetch failed|network/i, message: USER_MESSAGES.genericRetry },
  { test: /http\s*\d{3}/i, message: USER_MESSAGES.loadFailed },
];

/** Convierte un error interno en texto seguro para el usuario. */
export function mapErrorToUserMessage(
  error: unknown,
  fallback: string = USER_MESSAGES.genericRetry,
): string {
  if (!(error instanceof Error)) return fallback;

  const raw = error.message.trim();
  if (!raw) return fallback;

  for (const { test, message } of TECHNICAL_PATTERNS) {
    if (test.test(raw)) return message;
  }

  if (raw.length > 120 || raw.includes(" at ") || raw.includes("::")) {
    return fallback;
  }

  return fallback;
}
