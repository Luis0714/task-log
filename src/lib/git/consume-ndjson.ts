export async function consumeNdjson(
  body: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abort = () => {
    void reader.cancel();
  };
  signal?.addEventListener("abort", abort, { once: true });

  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = flushNdjsonBuffer(buffer, onLine);
    }

    buffer += decoder.decode();
    if (buffer.trim()) onLine(buffer.trim());
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export function flushNdjsonBuffer(
  buffer: string,
  onLine: (line: string) => void,
): string {
  const parts = buffer.split("\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    const line = part.trim();
    if (line) onLine(line);
  }
  return rest;
}
