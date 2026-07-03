const NETWORK_ERROR_PATTERN =
  /failed to fetch|load failed|networkerror|network request failed/i;

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}

function isNetworkErrorMessage(message: string): boolean {
  return NETWORK_ERROR_PATTERN.test(message.trim());
}

/** Mensaje legible para errores de red al generar o descargar exportaciones. */
export function readShareFetchError(cause: unknown, fallback: string): string {
  if (isAbortError(cause)) return "";

  if (!(cause instanceof Error)) return fallback;

  const message = cause.message.trim();
  if (!message || isNetworkErrorMessage(message)) {
    return "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.";
  }

  return message;
}

export function readShareActionError(cause: unknown, fallback: string): string {
  return readShareFetchError(cause, fallback);
}

export function rethrowShareFetchError(cause: unknown, fallback: string): never {
  if (isAbortError(cause)) throw cause;
  throw new Error(readShareFetchError(cause, fallback));
}
