import "server-only";

export function logApiError(context: string, cause: unknown): void {
  console.error(`[${context}]`, cause);
}
