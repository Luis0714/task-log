import { rethrowShareFetchError } from "@/lib/sprints/read-share-fetch-error";

export function readShareApiError(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

export type FetchShareBlobOptions = {
  url: string;
  signal?: AbortSignal;
  fallbackMessage: string;
  expectedMimeType: string;
  serverErrorLabel?: string;
};

export async function fetchShareBlob({
  url,
  signal,
  fallbackMessage,
  expectedMimeType,
  serverErrorLabel = "archivo",
}: FetchShareBlobOptions): Promise<Blob> {
  let response: Response;

  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    rethrowShareFetchError(cause, fallbackMessage);
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload: unknown = await response.json();
      throw new Error(readShareApiError(payload, fallbackMessage));
    }

    throw new Error(
      response.status === 500
        ? `Error del servidor al generar el ${serverErrorLabel}. Inténtalo de nuevo.`
        : fallbackMessage,
    );
  }

  const blob = await response.blob();
  if (blob.type === expectedMimeType || !blob.type) return blob;

  return blob.slice(0, blob.size, expectedMimeType);
}
